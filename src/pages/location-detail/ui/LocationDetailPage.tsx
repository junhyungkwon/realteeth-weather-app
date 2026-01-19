import { useLocation, useNavigate } from "react-router-dom";
import { useWeather } from "@/entities/weather/hooks/use-weather";
import { WeatherInfo } from "@/features/weather-display/ui/WeatherInfo";
import { FavoriteButton } from "@/features/favorites/ui/FavoriteButton";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import type { Location } from "@/shared/lib/location-search";
import { Button } from "@/shared/ui/Button";

export const LocationDetailPage = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state as { location: Location } | null;
  const location = locationState?.location;

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">위치 정보가 없습니다.</p>
          <Button onClick={() => navigate("/")}>홈으로 이동</Button>
        </div>
      </div>
    );
  }

  const {
    data: weather,
    isLoading,
    error,
  } = useWeather(location.lat, location.lon);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← 뒤로가기
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">
              해당 장소의 정보가 제공되지 않습니다.
            </p>
          </div>
        )}

        {weather && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                {location.fullName}
              </h1>
              <FavoriteButton location={location} onToggle={() => {}} />
            </div>
            <WeatherInfo weather={weather}/>
          </div>
        )}
      </div>
    </div>
  );
};
