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
    return data;
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

// 시군구별 대표 좌표 매핑 (주요 지역)
const getGuCoordinates = (
  address: string
): { lat: number; lon: number } | null => {
  const parsed = parseAddress(address);

  // 서울 주요 구별 좌표
  const seoulGuCoords: { [key: string]: { lat: number; lon: number } } = {
    강남구: { lat: 37.5172, lon: 127.0473 },
    강동구: { lat: 37.5301, lon: 127.1238 },
    강북구: { lat: 37.6398, lon: 127.0253 },
    강서구: { lat: 37.5509, lon: 126.8495 },
    관악구: { lat: 37.4784, lon: 126.9516 },
    광진구: { lat: 37.5384, lon: 127.0821 },
    구로구: { lat: 37.4954, lon: 126.8874 },
    금천구: { lat: 37.4519, lon: 126.9020 },
    노원구: { lat: 37.6542, lon: 127.0568 },
    도봉구: { lat: 37.6688, lon: 127.0471 },
    동대문구: { lat: 37.5744, lon: 127.0396 },
    동작구: { lat: 37.5124, lon: 126.9393 },
    마포구: { lat: 37.5663, lon: 126.9019 },
    서대문구: { lat: 37.5791, lon: 126.9368 },
    서초구: { lat: 37.4837, lon: 127.0324 },
    성동구: { lat: 37.5633, lon: 127.0366 },
    성북구: { lat: 37.5894, lon: 127.0167 },
    송파구: { lat: 37.5145, lon: 127.1058 },
    양천구: { lat: 37.5170, lon: 126.8664 },
    영등포구: { lat: 37.5264, lon: 126.8962 },
    용산구: { lat: 37.5326, lon: 126.9905 },
    은평구: { lat: 37.6027, lon: 126.9291 },
    종로구: { lat: 37.5735, lon: 126.9788 },
    중구: { lat: 37.5640, lon: 126.9970 },
    중랑구: { lat: 37.6064, lon: 127.0926 },
  };

  if (parsed.시도 === "서울특별시" && parsed.시군구 && seoulGuCoords[parsed.시군구]) {
    return seoulGuCoords[parsed.시군구];
  }

  return null;
};

// 개선된 좌표 가져오기 함수
const getImprovedCoordinates = (
  address: string
): { lat: number; lon: number } => {
  // 시군구별 좌표가 있으면 사용
  const guCoords = getGuCoordinates(address);
  if (guCoords) {
    return guCoords;
  }

  // 없으면 기본 좌표 사용
  return getDefaultCoordinates(address);
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
      // 개선된 좌표 사용
      coords = getImprovedCoordinates(address);
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

// 좌표로 가장 가까운 행정구역 찾기 (개선된 버전)
export const findNearestDistrict = async (
  lat: number,
  lon: number
): Promise<string | null> => {
  try {
    const districts = await loadDistrictsData();
    if (districts.length === 0) return null;

    // 1단계: 현재 좌표가 속한 시도 판단
    const sidoCoordinates: { [key: string]: { lat: number; lon: number } } = {
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

    // 가장 가까운 시도 찾기
    let nearestSidoDistance = Infinity;
    let targetSido: string | null = null;

    for (const [sido, coords] of Object.entries(sidoCoordinates)) {
      const distance = Math.sqrt(
        Math.pow(coords.lat - lat, 2) + Math.pow(coords.lon - lon, 2)
      );
      if (distance < nearestSidoDistance) {
        nearestSidoDistance = distance;
        targetSido = sido;
      }
    }

    // 2단계: 해당 시도의 동 단위 주소만 필터링
    const dongLevelAddresses = districts.filter((address) => {
      const parsed = parseAddress(address);
      return !!parsed.읍면동 && parsed.시도 === targetSido;
    });

    if (dongLevelAddresses.length === 0) {
      // 동 단위가 없으면 해당 시도의 시군구 단위로 찾기
      const guLevelAddresses = districts.filter((address) => {
        const parsed = parseAddress(address);
        return (
          !!parsed.시군구 &&
          !parsed.읍면동 &&
          parsed.시도 === targetSido
        );
      });

      if (guLevelAddresses.length === 0) {
        // 시군구도 없으면 시도만 반환
        const sidoAddresses = districts.filter((address) => {
          const parsed = parseAddress(address);
          return parsed.시도 === targetSido && !parsed.시군구 && !parsed.읍면동;
        });
        return sidoAddresses[0] || null;
      }

      // 시군구 중에서 가장 가까운 것 찾기
      let nearestDistance = Infinity;
      let nearestAddress: string | null = null;

      for (const address of guLevelAddresses) {
        const coords = getImprovedCoordinates(address);
        const distance = Math.sqrt(
          Math.pow(coords.lat - lat, 2) + Math.pow(coords.lon - lon, 2)
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestAddress = address;
        }
      }

      return nearestAddress;
    }

    // 3단계: 해당 시도의 동 단위 주소 중에서 가장 가까운 것 찾기
    let nearestDistance = Infinity;
    let nearestAddress: string | null = null;

    for (const address of dongLevelAddresses) {
      const coords = getImprovedCoordinates(address);
      const distance = Math.sqrt(
        Math.pow(coords.lat - lat, 2) + Math.pow(coords.lon - lon, 2)
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAddress = address;
      }
    }

    return nearestAddress;
  } catch (error) {
    console.error("가장 가까운 행정구역 찾기 실패:", error);
    return null;
  }
};

// 주소를 표시 형식으로 변환 (특별시/광역시는 시도-시군구-동, 일반 도는 시도-시군구-읍면동)
export const formatAddressForDisplay = (
  address: string | null
): string | null => {
  if (!address) return null;

  const parsed = parseAddress(address);

  // 특별시/광역시/특별자치시 체크
  const isMetropolitan =
    parsed.시도.includes("특별시") ||
    parsed.시도.includes("광역시") ||
    parsed.시도.includes("특별자치시");

  if (isMetropolitan) {
    // 특별시/광역시: 시도-시군구-동
    const parts = [parsed.시도];
    if (parsed.시군구) parts.push(parsed.시군구);
    if (parsed.읍면동) parts.push(parsed.읍면동);
    return parts.join(" ");
  } else {
    // 일반 도: 시도-시군구-읍면동 전체 표시
    const parts = [parsed.시도];
    if (parsed.시군구) parts.push(parsed.시군구);
    if (parsed.읍면동) parts.push(parsed.읍면동);
    return parts.join(" ");
  }
};