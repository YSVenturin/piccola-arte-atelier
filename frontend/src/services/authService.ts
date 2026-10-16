import axios from "axios";
import { api } from "./api";

export interface AuthUser {
  email: string;
  authorities: string[];
}

export async function getCurrentUser(signal?: AbortSignal) {
  const { data } = await api.get<AuthUser>("/auth/me", {
    signal,
  });

  return data;
}

export async function login(email: string, password: string) {
  await api.post(
    "/auth/login",
    new URLSearchParams({ email, password }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
}

export async function logout() {
  await api.post("/auth/logout");
}

export function getAuthErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Não foi possível concluir a operação.";
  }

  if (!error.response) {
    return "Não foi possível conectar ao servidor. Tente novamente.";
  }

  if (error.response.status === 401) {
    return error.config?.url === "/auth/login"
      ? "E-mail ou senha inválidos."
      : "Não foi possível confirmar sua sessão. Entre novamente.";
  }

  if (error.response.status === 403) {
    return "A solicitação foi recusada. Atualize a página e tente novamente.";
  }

  return "O servidor não conseguiu concluir a operação. Tente novamente.";
}