import { useState } from "react";
import { favoritesStorage } from "@/shared/lib/favorites";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";

interface FavoriteAliasEditorProps {
  locationId: string;
  currentAlias?: string;
  onSave: () => void;
}

export const FavoriteAliasEditor = ({
  locationId,
  currentAlias,
  onSave,
}: FavoriteAliasEditorProps) => {
  const [alias, setAlias] = useState(currentAlias || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    favoritesStorage.updateAlias(locationId, alias);
    setIsEditing(false);
    onSave();
  };

  const handleCancel = () => {
    setAlias(currentAlias || "");
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between w-full">
        <span className="text-sm text-gray-600 flex-1">
          {currentAlias || "별칭 없음"}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsEditing(true)}
          className="flex-shrink-0"
        >
          수정
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
      <Input
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        placeholder="별칭 입력"
        className="flex-1 min-w-0"
        autoFocus
      />
      <div className="flex gap-2 flex-shrink-0">
        <Button size="sm" onClick={handleSave} className="flex-1 sm:flex-none">
          저장
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCancel}
          className="flex-1 sm:flex-none"
        >
          취소
        </Button>
      </div>
    </div>
  );
};
