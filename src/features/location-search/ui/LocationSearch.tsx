import { useState, useEffect, useRef } from "react";
import { searchLocations } from "@/shared/lib/location-search";
import type { Location } from "@/shared/lib/location-search";
import { Input } from "@/shared/ui/Input";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

interface LocationSearchProps {
  onSelectLocation: (location: Location) => void;
}

export const LocationSearch = ({ onSelectLocation }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        // 검색어가 없어도 포커스 상태면 결과창을 유지하지 않음
        return;
      }

      setLoading(true);
      try {
        const searchResults = await searchLocations(query);
        setResults(searchResults);
        // 검색 결과가 있으면 자동으로 표시
        if (searchResults.length > 0) {
          setShowResults(true);
        }
      } catch (error) {
        console.error("검색 오류:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (location: Location) => {
    onSelectLocation(location);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleFocus = () => {
    // 포커스 시 검색 결과가 있으면 표시
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <Input
        type="text"
        placeholder="시, 구, 동으로 검색 (예: 서울특별시, 종로구, 청운동)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
      />

      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
            >
              <div className="font-medium text-gray-900">
                {location.fullName}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && !loading && query && results.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-gray-500 text-center">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
