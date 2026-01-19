export interface Location {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lon: number;
}

// JSON 파일을 동적으로 로드
let districtsData: string[] | null = null;

export const loadDistrictsData = async (): Promise<string[]> => {
  if (districtsData) return districtsData;

  try {
    const response = await fetch("/korea_districts.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    districtsData = data;
    return data; // districtsData 대신 data를 직접 반환
  } catch (error) {
    console.error("행정구역 데이터 로드 실패:", error);
    return [];
  }
};

// 주소 문자열을 파싱하여 시도, 시군구, 읍면동 추출
const parseAddress = (
  address: string
): { 시도: string; 시군구: string; 읍면동?: string } => {
  const parts = address.split("-");
  return {
    시도: parts[0] || "",
    시군구: parts[1] || "",
    읍면동: parts[2],
  };
};

// 시도/시군구별 대표 좌표 매핑
const getDefaultCoordinates = (
  address: string
): { lat: number; lon: number } => {
  const parsed = parseAddress(address);

  // 주요 시도별 대표 좌표
  const cityCoordinates: { [key: string]: { lat: number; lon: number } } = {
    서울특별시: { lat: 37.5665, lon: 126.978 },
    부산광역시: { lat: 35.1796, lon: 129.0756 },
    대구광역시: { lat: 35.8714, lon: 128.6014 },
    인천광역시: { lat: 37.4563, lon: 126.7052 },
    광주광역시: { lat: 35.1595, lon: 126.8526 },
    대전광역시: { lat: 36.3504, lon: 127.3845 },
    울산광역시: { lat: 35.5384, lon: 129.3114 },
    세종특별자치시: { lat: 36.48, lon: 127.289 },
    경기도: { lat: 37.4138, lon: 127.5183 },
    강원특별자치도: { lat: 37.8228, lon: 128.1555 },
    강원도: { lat: 37.8228, lon: 128.1555 },
    충청북도: { lat: 36.8, lon: 127.7 },
    충청남도: { lat: 36.5184, lon: 126.8 },
    전북특별자치도: { lat: 35.7175, lon: 127.153 },
    전라북도: { lat: 35.7175, lon: 127.153 },
    전라남도: { lat: 34.8679, lon: 126.991 },
    경상북도: { lat: 36.4919, lon: 128.8889 },
    경상남도: { lat: 35.4606, lon: 128.2132 },
    제주특별자치도: { lat: 33.4996, lon: 126.5312 },
    제주도: { lat: 33.4996, lon: 126.5312 },
  };

  // 시도명으로 대표 좌표 찾기
  if (cityCoordinates[parsed.시도]) {
    return cityCoordinates[parsed.시도];
  }

  // 기본값 (서울)
  return { lat: 37.5665, lon: 126.978 };
};

// 좌표 캐시 (메모리 기반)
const coordinatesCache = new Map<string, { lat: number; lon: number }>();

export const searchLocations = async (query: string): Promise<Location[]> => {
  if (!query.trim()) return [];

  const districts = await loadDistrictsData();

  if (districts.length === 0) {
    console.warn(
      "행정구역 데이터가 없습니다. korea_districts.json 파일을 확인하세요."
    );
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  const matchedAddresses: string[] = [];
  const seen = new Set<string>();

  // 1단계: 검색어와 매칭되는 주소 찾기
  for (const address of districts) {
    const lowerAddress = address.toLowerCase();
    const parsed = parseAddress(address);

    // 검색어가 주소의 어느 부분에든 포함되어 있으면 매칭
    if (
      lowerAddress.includes(lowerQuery) ||
      parsed.시도.toLowerCase().includes(lowerQuery) ||
      parsed.시군구.toLowerCase().includes(lowerQuery) ||
      (parsed.읍면동 && parsed.읍면동.toLowerCase().includes(lowerQuery))
    ) {
      const id = address;

      // 중복 제거
      if (!seen.has(id)) {
        seen.add(id);
        matchedAddresses.push(address);
      }
    }
  }

  // 최대 10개까지만 처리
  const addressesToProcess = matchedAddresses.slice(0, 10);

  // 2단계: 매칭된 주소들에 대해 좌표 가져오기
  const locations: Location[] = addressesToProcess.map((address) => {
    const parsed = parseAddress(address);

    // 캐시 확인
    let coords = coordinatesCache.get(address);
    if (!coords) {
      // 대표 좌표 사용 (빠른 처리)
      coords = getDefaultCoordinates(address);
      coordinatesCache.set(address, coords);
    }

    return {
      id: address,
      name: parsed.읍면동 || parsed.시군구 || parsed.시도,
      fullName: address.replace(/-/g, " "),
      lat: coords.lat,
      lon: coords.lon,
    };
  });

  // 정확도 순으로 정렬 (정확히 일치하는 것 우선)
  return locations.sort((a, b) => {
    const aExact = a.fullName.toLowerCase() === lowerQuery;
    const bExact = b.fullName.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.fullName.localeCompare(b.fullName);
  });
};
