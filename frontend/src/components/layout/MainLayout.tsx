import { Outlet } from "react-router";

import { Footer } from "./Footer";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-50 text-brand-900">
      <Header />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}