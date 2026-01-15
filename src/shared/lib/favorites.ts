import type { Location } from "./location-search";

export interface FavoriteLocation extends Location {
  alias?: string;
  addedAt: number;
}

const FAVORITES_KEY = "weather-favorites";
const MAX_FAVORITES = 6;

export const favoritesStorage = {
  get: (): FavoriteLocation[] => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  add: (location: Location, alias?: string): boolean => {
    const favorites = favoritesStorage.get();
    if (favorites.length >= MAX_FAVORITES) return false;
    if (favorites.some((fav) => fav.id === location.id)) return false;

    favorites.push({
      ...location,
      alias,
      addedAt: Date.now(),
    });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  },

  remove: (id: string): void => {
    const favorites = favoritesStorage.get();
    const filtered = favorites.filter((fav) => fav.id !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  },

  updateAlias: (id: string, alias: string): void => {
    const favorites = favoritesStorage.get();
    const updated = favorites.map((fav) =>
      fav.id === id ? { ...fav, alias } : fav
    );
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },

  isFavorite: (id: string): boolean => {
    const favorites = favoritesStorage.get();
    return favorites.some((fav) => fav.id === id);
  },
};
