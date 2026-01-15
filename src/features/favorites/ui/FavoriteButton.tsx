import { useNavigate } from "react-router-dom";
import { favoritesStorage } from "@/shared/lib/favorites";
import type { Location } from "@/shared/lib/location-search";
import { Button } from "@/shared/ui/Button";

interface FavoriteButtonProps {
  location: Location;
  onToggle: () => void;
}

export const FavoriteButton = ({ location, onToggle }: FavoriteButtonProps) => {
  const navigate = useNavigate();
  const isFavorite = favoritesStorage.isFavorite(location.id);

  const handleToggle = () => {
    if (isFavorite) {
      // 즐겨찾기 제거
      favoritesStorage.remove(location.id);
      alert("즐겨찾기가 삭제되었습니다.");
      onToggle();
      // 메인 페이지로 이동
      navigate("/");
    } else {
      // 즐겨찾기 추가
      const success = favoritesStorage.add(location);
      if (!success) {
        alert("즐겨찾기는 최대 6개까지 추가할 수 있습니다.");
        return;
      }
      onToggle();
    }
  };

  return (
    <Button
      variant={isFavorite ? "danger" : "primary"}
      size="sm"
      onClick={handleToggle}
    >
      {isFavorite ? "즐겨찾기 제거" : "즐겨찾기 추가"}
    </Button>
  );
};
