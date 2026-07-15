import { Route, Routes } from "react-router";

import { MainLayout } from "../components/layout/MainLayout";
import { AboutPage } from "../pages/AboutPage";
import { ContactPage } from "../pages/ContactPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage";
import { ProductListPage } from "../pages/ProductListPage";
import { ROUTE_SEGMENTS } from "./routePaths";

export function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />

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

                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    )
}