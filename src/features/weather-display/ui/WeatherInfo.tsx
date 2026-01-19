import type { WeatherData } from "@/shared/api/weather-api";
import { formatTime } from "@/shared/lib/format-date";

interface WeatherInfoProps {
  weather: WeatherData;
}

export const WeatherInfo = ({ weather }: WeatherInfoProps) => {
  const current = weather.current;
  const today = weather.daily[0];
  const hourly = weather.hourly.slice(0, 24);

  return (
    <div className="space-y-6">
      {/* 현재 날씨 */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-6xl font-bold">
              {Math.round(current.temp)}°
            </div>
            <div className="text-xl mt-2">
              {current.weather[0]?.description}
            </div>
            <div className="text-sm mt-1">
              체감온도 {Math.round(current.feels_like)}°
            </div>
          </div>
          {current.weather[0]?.icon && (
            <img
              src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
              alt={current.weather[0].main}
              className="w-24 h-24"
            />
          )}
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div>습도: {current.humidity}%</div>
        </div>
      </div>

      {/* 오늘의 기온 */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4">오늘의 기온</h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-sm text-gray-600">최저</div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(today.temp.min)}°
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">현재</div>
            <div className="text-2xl font-bold">
              {Math.round(current.temp)}°
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">최고</div>
            <div className="text-2xl font-bold text-red-600">
              {Math.round(today.temp.max)}°
            </div>
          </div>
        </div>
      </div>

      {/* 시간대별 기온 */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4">24시간 기온</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-20 min-w-max">
            {hourly.map((hour, index) => (
              <div
                key={index}
                className="flex flex-col items-center min-w-[60px]"
              >
                <div className="text-xs text-gray-600 mb-2">
                  {formatTime(hour.dt)}
                </div>
                {hour.weather[0]?.icon && (
                  <img
                    src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                    alt={hour.weather[0].main}
                    className="w-8 h-8 mb-1"
                  />
                )}
                <div className="text-sm font-medium">
                  {Math.round(hour.temp)}°
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};