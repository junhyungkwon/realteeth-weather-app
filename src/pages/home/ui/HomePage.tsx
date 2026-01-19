import { useState, useEffect } from "react";
import { useGeolocation } from "@/shared/hooks/use-geolocation";
import { useWeather } from "@/entities/weather/hooks/use-weather";
import { LocationSearch } from "@/features/location-search/ui/LocationSearch";
import type { Location } from "@/shared/lib/location-search";
import { findNearestDistrict, formatAddressForDisplay } from "@/shared/lib/location-search";
import { WeatherInfo } from "@/features/weather-display/ui/WeatherInfo";
import { FavoriteButton } from "@/features/favorites/ui/FavoriteButton";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { Link } from "react-router-dom";
import { favoritesStorage } from "@/shared/lib/favorites";

export const HomePage = () => {
  const { lat, lon, loading: geoLoading, error: geoError } = useGeolocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  // 선택된 위치 또는 현재 위치의 좌표 사용
  const currentLat = selectedLocation?.lat ?? lat;
  const currentLon = selectedLocation?.lon ?? lon;

  // 날씨 데이터 가져오기
  const {
    data: weather,
    isLoading: weatherLoading,
    error: weatherError,
  } = useWeather(currentLat, currentLon);

  // 현재 위치의 주소 가져오기
  useEffect(() => {
    if (lat && lon && !selectedLocation) {
      findNearestDistrict(lat, lon).then((address) => {
        const formattedAddress = formatAddressForDisplay(address);
        setCurrentAddress(formattedAddress);
      });
    } else if (selectedLocation) {
      setCurrentAddress(null);
    }
  }, [lat, lon, selectedLocation]);

  // Geolocation 에러를 무시하고 조용히 처리
  useEffect(() => {
    // 콘솔 에러 필터링
    const originalError = console.error;
    console.error = (...args) => {
      if (
        args.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("CoreLocation") ||
              arg.includes("kCLErrorLocationUnknown"))
        )
      ) {
        // CoreLocation 에러는 무시
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // 즐겨찾기 개수 업데이트
  useEffect(() => {
    const updateFavoritesCount = () => {
      setFavoritesCount(favoritesStorage.get().length);
    };
    updateFavoritesCount();

    // localStorage 변경 감지를 위한 이벤트 리스너
    const handleStorageChange = () => {
      updateFavoritesCount();
    };
    window.addEventListener("storage", handleStorageChange);

    // 주기적으로 확인 (같은 탭에서의 변경 감지)
    const interval = setInterval(updateFavoritesCount, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const locationName = selectedLocation
    ? selectedLocation.fullName
    : geoError
    ? "위치를 찾을 수 없습니다"
    : currentAddress || "현재 위치";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">날씨 앱</h1>
          <Link
            to="/favorites"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            즐겨찾기 ({favoritesCount})
          </Link>
        </div>

        {/* 위치 검색 */}
        <div className="mb-8">
          <LocationSearch onSelectLocation={handleLocationSelect} />
        </div>

        {/* 날씨 정보 */}
        {geoLoading && !selectedLocation && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">위치를 찾는 중...</p>
            </div>
          </div>
        )}

        {geoError && !selectedLocation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              위치 정보를 가져올 수 없습니다. 위에서 장소를 검색해주세요.
            </p>
          </div>
        )}

        {weatherLoading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {weatherError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">
              해당 장소의 정보가 제공되지 않습니다.
            </p>
          </div>
        )}

{weather && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {locationName}
                </h2>
              </div>
              {selectedLocation && (
                <FavoriteButton
                  location={selectedLocation}
                  onToggle={() =>
                    setFavoritesCount(favoritesStorage.get().length)
                  }
                />
              )}
            </div>
            <WeatherInfo weather={weather} />
          </div>
        )}
      </div>
    </div>
  );
};