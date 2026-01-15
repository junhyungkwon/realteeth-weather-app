import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "@/shared/api/weather-api";
import type { WeatherData } from "@/shared/api/weather-api";

export const useWeather = (lat: number | null, lon: number | null) => {
  return useQuery<WeatherData, Error>({
    queryKey: ["weather", lat, lon],
    queryFn: () => {
      if (!lat || !lon) throw new Error("Coordinates required");
      return weatherApi.getWeatherByCoords(lat, lon);
    },
    enabled: !!lat && !!lon,
    staleTime: 5 * 60 * 1000, // 5분
    retry: 1,
  });
};
