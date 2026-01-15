import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { favoritesStorage } from "@/shared/lib/favorites";
import type { FavoriteLocation } from "@/shared/lib/favorites";
import { WeatherCard } from "@/widgets/weather-card/ui/WeatherCard";
import { Button } from "@/shared/ui/Button";

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);

  const updateFavorites = () => {
    setFavorites(favoritesStorage.get());
  };

  useEffect(() => {
    updateFavorites();

    const handleStorageChange = () => {
      updateFavorites();
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(updateFavorites, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">즐겨찾기</h1>
          <Button variant="secondary" onClick={() => navigate("/")}>
            홈으로
          </Button>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <p className="text-gray-600 mb-4">
              즐겨찾기에 추가된 장소가 없습니다.
            </p>
            <Button onClick={() => navigate("/")}>장소 검색하기</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <WeatherCard
                key={favorite.id}
                favorite={favorite}
                onUpdate={updateFavorites}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
