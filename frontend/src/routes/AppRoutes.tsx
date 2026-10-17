import { Navigate, Outlet, Route, Routes } from "react-router";

import { AuthProvider } from "../auth/AuthProvider";
import { RequireAdmin } from "../auth/RequireAdmin";
import { AdminLayout } from "../components/admin/AdminLayout";
import { MainLayout } from "../components/layout/MainLayout";

import { AboutPage } from "../pages/AboutPage";
import { ContactPage } from "../pages/ContactPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage";
import { ProductListPage } from "../pages/ProductListPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminCategoriesPage } from "../pages/admin/AdminCategoriesPage";
import { AdminProductsPage } from "../pages/admin/AdminProductsPage";
import { AdminProductEditPage } from "../pages/admin/AdminProductEditPage";

import { ROUTE_SEGMENTS } from "./routePaths";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="admin"
        element={
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        }
      >
        <Route
          path="login"
          element={<AdminLoginPage />}
        />

        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route
              index
              element={<AdminDashboardPage />}
            />

            <Route
              path="categorias"
              element={<AdminCategoriesPage />}
            />

            <Route
              path="produtos"
              element={<AdminProductsPage />}
            />

            <Route
              path="produtos/:productId"
              element={<AdminProductEditPage />}
            />

            <Route
              path="*"
              element={<Navigate to="/admin" replace />}
            />
          </Route>
        </Route>
      </Route>

      <Route element={<MainLayout />}>
        <Route
          index
          element={<HomePage />}
        />

        <Route
          path={ROUTE_SEGMENTS.products}
          element={<ProductListPage />}
        />

        <Route
          path={ROUTE_SEGMENTS.productDetails}
          element={<ProductDetailsPage />}
        />

        <Route
          path={ROUTE_SEGMENTS.about}
          element={<AboutPage />}
        />

        <Route
          path={ROUTE_SEGMENTS.contact}
          element={<ContactPage />}
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
}