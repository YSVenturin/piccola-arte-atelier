import { Link, NavLink, Outlet } from "react-router";

import logoMark from "../../assets/images/brand/logo-mark.webp";
import { useAuth } from "../../auth/AuthContext";
import { LogoutButton } from "./LogoutButton";
import { PageContainer } from "../layout/PageContainer";

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-brand-200 bg-brand-100 p-6 lg:border-r lg:border-b-0">
        <Link
          to="/admin"
          className="flex items-center gap-3"
        >
          <img
            src={logoMark}
            alt=""
            className="size-12 object-contain"
          />

          <span>
            <span className="block font-display text-2xl font-semibold">
              Piccola Arte
            </span>

            <span className="text-xs text-brand-600">
              Administração do atelier
            </span>
          </span>
        </Link>

        <nav
          aria-label="Menu administrativo"
          className="mt-6 flex flex-wrap gap-2 lg:flex-col"
        >
          {[
            { to: "/admin", label: "Visão geral" },
            { to: "/admin/categorias", label: "Categorias" },
            { to: "/admin/produtos", label: "Produtos" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-900 text-brand-50"
                    : "text-brand-800 hover:bg-brand-200"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-brand-200">
          <PageContainer className="flex flex-wrap items-center justify-between gap-5 py-5">
            <div className="min-w-0">
              <p className="text-xs text-brand-600">
                Conectado como
              </p>

              <p className="break-all text-sm font-semibold">
                {user?.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/produtos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline underline-offset-4"
              >
                Ver catálogo ↗
              </Link>

              <LogoutButton />
            </div>
          </PageContainer>
        </header>

        <main className="py-8 lg:py-12">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  );
}