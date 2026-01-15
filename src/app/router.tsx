import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomePage } from "@/pages/home/ui/HomePage";
import { LocationDetailPage } from "@/pages/location-detail/ui/LocationDetailPage";
import { FavoritesPage } from "@/pages/favorites/ui/FavoritesPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/location/:id",
    element: <LocationDetailPage />,
  },
  {
    path: "/favorites",
    element: <FavoritesPage />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
