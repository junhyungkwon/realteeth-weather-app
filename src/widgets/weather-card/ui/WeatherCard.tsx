import { Link } from "react-router-dom";
import { useWeather } from "@/entities/weather/hooks/use-weather";
import type { FavoriteLocation } from "@/shared/lib/favorites";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { FavoriteAliasEditor } from "@/features/favorites/ui/FavoriteAliasEditor";

interface WeatherCardProps {
  favorite: FavoriteLocation;
  onUpdate: () => void;
}

export const WeatherCard = ({ favorite, onUpdate }: WeatherCardProps) => {
  const {
    data: weather,
    isLoading,
    error,
  } = useWeather(favorite.lat, favorite.lon);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="text-center text-gray-500">
          <p className="font-semibold mb-2">
            {favorite.alias || favorite.fullName}
          </p>
          <p className="text-sm">해당 장소의 정보가 제공되지 않습니다.</p>
        </div>
      </div>
    );
  }

  const current = weather.current;
  const today = weather.daily[0];

  return (
    <Link
      to={`/location/${favorite.id}`}
      state={{ location: favorite }}
      className="block bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {favorite.alias || favorite.fullName}
          </h3>
          <p className="text-sm text-gray-500">{favorite.fullName}</p>
        </div>
        {current.weather[0]?.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
            alt={current.weather[0].main}
            className="w-16 h-16"
          />
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold">{Math.round(current.temp)}°</div>
        <div className="text-sm text-gray-600">
          <div>최저 {Math.round(today.temp.min)}°</div>
          <div>최고 {Math.round(today.temp.max)}°</div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <FavoriteAliasEditor
            locationId={favorite.id}
            currentAlias={favorite.alias}
            onSave={onUpdate}
          />
        </div>
      </div>
    </Link>
  );
};
