import axios from "axios";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { onAdminUnauthorized } from "../services/api";
import {
  getCurrentUser,
  login,
  logout,
} from "../services/authService";
import type { AuthUser } from "../services/authService";
import { AuthContext } from "./AuthContext";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const version = useRef(0);
  const busy = useRef(false);
  const hadSession = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      if (busy.current) return;

      const currentVersion = ++version.current;

      try {
        const currentUser = await getCurrentUser(
          controller.signal,
        );

        if (
          controller.signal.aborted ||
          currentVersion !== version.current
        ) {
          return;
        }

        hadSession.current = true;
        setUser(currentUser);
        setSessionExpired(false);
        setError(false);
      } catch (cause) {
        if (
          controller.signal.aborted ||
          currentVersion !== version.current
        ) {
          return;
        }

        if (
          axios.isAxiosError(cause) &&
          cause.response?.status === 401
        ) {
          setUser(null);
          setSessionExpired(hadSession.current);
          setError(false);
        } else {
          setError(true);
        }
      } finally {
        if (
          !controller.signal.aborted &&
          currentVersion === version.current
        ) {
          setLoading(false);
        }
      }
    }

    const unsubscribe = onAdminUnauthorized(() => {
      version.current++;
      setUser(null);
      setSessionExpired(true);
      setLoading(false);
      setError(false);
    });

    void checkSession();

    window.addEventListener("focus", checkSession);

    return () => {
      controller.abort();
      unsubscribe();
      window.removeEventListener("focus", checkSession);
    };
  }, [attempt]);

  async function signIn(email: string, password: string) {
    busy.current = true;
    version.current++;

    try {
      await login(email, password);

      const currentUser = await getCurrentUser();

      hadSession.current = true;
      setUser(currentUser);
      setSessionExpired(false);
    } finally {
      busy.current = false;
    }
  }

  async function signOut() {
    busy.current = true;
    version.current++;

    try {
      await logout();

      hadSession.current = false;
      setUser(null);
      setSessionExpired(false);
    } finally {
      busy.current = false;
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          title="Não foi possível verificar sua sessão"
          message="Confira sua conexão e se o servidor está disponível."
          onRetry={() => {
            setLoading(true);
            setError(false);
            setAttempt((value) => value + 1);
          }}
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionExpired,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}