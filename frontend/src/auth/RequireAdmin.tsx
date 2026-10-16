import { Navigate, Outlet } from "react-router";

import { LogoutButton } from "../components/admin/LogoutButton";
import { useAuth } from "./AuthContext";

export function RequireAdmin() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!user.authorities.includes("ROLE_ADMIN")) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl">
          Acesso restrito
        </h1>

        <p className="my-6">
          Esta conta não tem permissão para administrar o catálogo.
        </p>

        <LogoutButton />
      </main>
    );
  }

  return <Outlet />;
}