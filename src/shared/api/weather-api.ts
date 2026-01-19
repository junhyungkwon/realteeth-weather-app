import axios from "axios";

const WEATHER_API_KEY =
  import.meta.env.VITE_WEATHER_API_KEY ||
  "TWH8Edh6MqUvBvGucuCxxzLf26%2BS2yi9zimLaXrTjLZgHvbZ8WMO8G4Gfhd7szF0GqkEPSiDdbBiLLdKRRIz4Q%3D%3D";
const WEATHER_API_BASE_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";

// 위도/경도를 격자 좌표로 변환
const convertToGrid = (
  lat: number,
  lon: number
): { nx: number; ny: number } => {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
};

// 초단기실황조회용 base_time (30분 단위: 0030, 0130)
const getBaseDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = now.getHours();
  const minute = now.getMinutes();

  // 초단기실황조회는 매 시간 30분에 데이터 생성
  // 현재 시간이 30분 이전이면 이전 시간의 30분 데이터 사용
  let baseHour = hour;
  let baseMinute = "30";

  if (minute < 30) {
    // 30분 이전이면 이전 시간의 30분 데이터 사용
    baseHour = hour - 1;
    if (baseHour < 0) {
      // 자정 이전이면 전날 23:30 사용
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        baseDate: `${yesterday.getFullYear()}${String(
          yesterday.getMonth() + 1
        ).padStart(2, "0")}${String(yesterday.getDate()).padStart(2, "0")}`,
        baseTime: "2330",
      };
    }
  }

  return {
    baseDate: `${year}${month}${day}`,
    baseTime: `${String(baseHour).padStart(2, "0")}${baseMinute}`,
  };
};

// 단기예보조회용 base_time (정시 단위: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)
const getForecastBaseTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = now.getHours();

  // 단기예보는 3시간 단위로 제공 (02, 05, 08, 11, 14, 17, 20, 23시)
  // 가장 가까운 이전 정시로 설정
  const forecastHours = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseHour = 23; // 기본값

  for (let i = forecastHours.length - 1; i >= 0; i--) {
    if (hour >= forecastHours[i]) {
      baseHour = forecastHours[i];
      break;
    }
  }

  // 전날 23시로 설정해야 할 경우
  if (hour < 2) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      baseDate: `${yesterday.getFullYear()}${String(
        yesterday.getMonth() + 1
      ).padStart(2, "0")}${String(yesterday.getDate()).padStart(2, "0")}`,
      baseTime: "2300",
    };
  }

  return {
    baseDate: `${year}${month}${day}`,
    baseTime: `${String(baseHour).padStart(2, "0")}00`,
  };
};

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  weather: WeatherCondition[];
  dt: number;
}

export interface DailyWeather {
  temp: {
    min: number;
    max: number;
  };
  dt: number;
  weather: WeatherCondition[];
}

export interface HourlyWeather {
  temp: number;
  dt: number;
  weather: WeatherCondition[];
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyWeather[];
  hourly: HourlyWeather[];
  lat: number;
  lon: number;
}

export interface WeatherError {
  message: string;
  cod?: string;
}

// 기상청 날씨 코드를 설명으로 변환
const getWeatherDescription = (skyCode: string, ptyCode: string): string => {
  if (ptyCode === "1") return "비";
  if (ptyCode === "2") return "비/눈";
  if (ptyCode === "3") return "눈";
  if (ptyCode === "4") return "소나기";
  if (skyCode === "1") return "맑음";
  if (skyCode === "3") return "구름많음";
  if (skyCode === "4") return "흐림";
  return "맑음";
};

// 기상청 날씨 코드를 아이콘으로 변환
const getWeatherIcon = (skyCode: string, ptyCode: string): string => {
  if (ptyCode === "1" || ptyCode === "4") return "10d";
  if (ptyCode === "2") return "13d";
  if (ptyCode === "3") return "13d";
  if (skyCode === "1") return "01d";
  if (skyCode === "3") return "03d";
  if (skyCode === "4") return "04d";
  return "01d";
};

export const weatherApi = {
  getWeatherByCoords: async (
    lat: number,
    lon: number
  ): Promise<WeatherData> => {
    try {
      // 격자 좌표로 변환
      const { nx, ny } = convertToGrid(lat, lon);
      const { baseDate, baseTime } = getBaseDateTime();
      const { baseDate: forecastBaseDate, baseTime: forecastBaseTime } =
        getForecastBaseTime();

      // serviceKey를 URL에 직접 포함 (이미 인코딩된 키를 그대로 사용)
      const serviceKey = WEATHER_API_KEY;

      // 초단기실황조회 (현재 날씨)
      const currentUrl = `${WEATHER_API_BASE_URL}/getUltraSrtNcst?serviceKey=${serviceKey}&pageNo=1&numOfRows=10&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

      const currentResponse = await axios.get(currentUrl);

      // 단기예보조회 (일일 및 시간별 예보)
      const forecastUrl = `${WEATHER_API_BASE_URL}/getVilageFcst?serviceKey=${serviceKey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${forecastBaseDate}&base_time=${forecastBaseTime}&nx=${nx}&ny=${ny}`;

      const forecastResponse = await axios.get(forecastUrl);

      // 응답 데이터 확인
      if (currentResponse.data.response?.header?.resultCode !== "00") {
        throw new Error(
          currentResponse.data.response?.header?.resultMsg ||
            "초단기실황조회 실패"
        );
      }

      if (forecastResponse.data.response?.header?.resultCode !== "00") {
        throw new Error(
          forecastResponse.data.response?.header?.resultMsg ||
            "단기예보조회 실패"
        );
      }

      const currentData = currentResponse.data.response.body.items.item;
      const forecastData = forecastResponse.data.response.body.items.item;

      // 배열이 아닌 경우 배열로 변환
      const currentItems = Array.isArray(currentData)
        ? currentData
        : [currentData];
      const forecastItems = Array.isArray(forecastData)
        ? forecastData
        : [forecastData];

      // 현재 날씨 데이터 파싱
      const currentTemp = parseFloat(
        currentItems.find((item: any) => item.category === "T1H")?.obsrValue ||
          "0"
      );
      const currentSky =
        currentItems.find((item: any) => item.category === "SKY")?.obsrValue ||
        "1";
      const currentPty =
        currentItems.find((item: any) => item.category === "PTY")?.obsrValue ||
        "0";
      const currentHumidity = parseFloat(
        currentItems.find((item: any) => item.category === "REH")?.obsrValue ||
          "0"
      );

      // 예보 데이터 파싱
      const tempData: {
        [key: string]: { values: number[]; min?: number; max?: number };
      } = {};
      const skyData: { [key: string]: string } = {};
      const ptyData: { [key: string]: string } = {};

      forecastItems.forEach((item: any) => {
        const fcstDate = item.fcstDate;
        if (item.category === "TMP") {
          if (!tempData[fcstDate]) {
            tempData[fcstDate] = { values: [] };
          }
          tempData[fcstDate].values.push(parseFloat(item.fcstValue));
        } else if (item.category === "TMN") {
          if (!tempData[fcstDate]) {
            tempData[fcstDate] = { values: [] };
          }
          tempData[fcstDate].min = parseFloat(item.fcstValue);
        } else if (item.category === "TMX") {
          if (!tempData[fcstDate]) {
            tempData[fcstDate] = { values: [] };
          }
          tempData[fcstDate].max = parseFloat(item.fcstValue);
        }
        if (item.category === "SKY") {
          skyData[item.fcstDate + item.fcstTime] = item.fcstValue;
        }
        if (item.category === "PTY") {
          ptyData[item.fcstDate + item.fcstTime] = item.fcstValue;
        }
      });

      // 일일 예보 생성
      const daily: DailyWeather[] = [];
      const dailyDates = Object.keys(tempData).slice(0, 5);

      dailyDates.forEach((date) => {
        const temps = tempData[date];
        const minTemp =
          temps.min !== undefined
            ? temps.min
            : temps.values.length > 0
            ? Math.min(...temps.values.filter((t: number) => !isNaN(t)))
            : 0;
        const maxTemp =
          temps.max !== undefined
            ? temps.max
            : temps.values.length > 0
            ? Math.max(...temps.values.filter((t: number) => !isNaN(t)))
            : 0;
        const dateObj = new Date(
          parseInt(date.substring(0, 4)),
          parseInt(date.substring(4, 6)) - 1,
          parseInt(date.substring(6, 8))
        );

        daily.push({
          temp: {
            min: minTemp,
            max: maxTemp,
          },
          dt: Math.floor(dateObj.getTime() / 1000),
          weather: [
            {
              id: 800,
              main: "Clear",
              description: getWeatherDescription(
                skyData[date + "1200"] || "1",
                ptyData[date + "1200"] || "0"
              ),
              icon: getWeatherIcon(
                skyData[date + "1200"] || "1",
                ptyData[date + "1200"] || "0"
              ),
            },
          ],
        });
      });

      // 시간별 예보 생성 (24시간)
      const hourly: HourlyWeather[] = [];
      const hourlyTimes = ["00", "03", "06", "09", "12", "15", "18", "21"];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      hourlyTimes.forEach((time) => {
        const dateTime = new Date(today);
        dateTime.setHours(parseInt(time));
        if (dateTime <= new Date()) {
          dateTime.setDate(dateTime.getDate() + 1);
        }

        const dateStr = `${dateTime.getFullYear()}${String(
          dateTime.getMonth() + 1
        ).padStart(2, "0")}${String(dateTime.getDate()).padStart(2, "0")}`;
        const timeStr = `${time}00`;
        const key = dateStr + timeStr;

        const temp = parseFloat(
          forecastItems.find(
            (item: any) =>
              item.fcstDate === dateStr &&
              item.fcstTime === timeStr &&
              item.category === "TMP"
          )?.fcstValue || "0"
        );
        const sky = skyData[key] || "1";
        const pty = ptyData[key] || "0";

        hourly.push({
          temp,
          dt: Math.floor(dateTime.getTime() / 1000),
          weather: [
            {
              id: 800,
              main: "Clear",
              description: getWeatherDescription(sky, pty),
              icon: getWeatherIcon(sky, pty),
            },
          ],
        });
      });

      // WeatherData 형식으로 변환
      return {
        current: {
          temp: currentTemp,
          feels_like: currentTemp,
          humidity: currentHumidity,
          weather: [
            {
              id: 800,
              main: "Clear",
              description: getWeatherDescription(currentSky, currentPty),
              icon: getWeatherIcon(currentSky, currentPty),
            },
          ],
          dt: Math.floor(new Date().getTime() / 1000),
        },
        daily: daily.slice(0, 5),
        hourly: hourly.slice(0, 8),
        lat,
        lon,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.response?.header?.resultMsg ||
          error.message ||
          "날씨 정보를 가져오는데 실패했습니다.";
        throw new Error(errorMessage);
      }
      throw new Error("날씨 정보를 가져오는데 실패했습니다.");
    }
  },
};
