import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router";

import logoMark from "../../assets/images/brand/logo-mark.webp";
import { useAuth } from "../../auth/AuthContext";
import { getAuthErrorMessage } from "../../services/authService";

export function AdminLoginPage() {
  const { user, sessionExpired, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(getAuthErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col justify-center bg-brand-200/60 px-6 py-10 lg:px-16">
        <img
          src={logoMark}
          alt=""
          className="mb-6 size-20 object-contain"
        />

        <p className="text-xs font-semibold uppercase tracking-[0.25em]">
          Piccola Arte Atelier
        </p>

        <h1 className="mt-4 max-w-lg font-display text-5xl lg:text-7xl">
          Um espaço para cuidar de cada detalhe.
        </h1>

        <p className="mt-5 max-w-md leading-7 text-brand-700">
          Organize as peças e mantenha o catálogo do atelier
          sempre atualizado.
        </p>

        <Link
          to="/"
          className="mt-8 w-fit text-sm underline underline-offset-4"
        >
          ← Voltar ao catálogo
        </Link>
      </section>

      <section
        aria-labelledby="login-title"
        className="flex items-center justify-center px-6 py-12 lg:px-16"
      >
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Área administrativa
          </p>

          <h2
            id="login-title"
            className="mt-3 font-display text-4xl"
          >
            Bem-vindo de volta
          </h2>

          <p className="mt-3 text-sm leading-6 text-brand-700">
            Entre com a conta responsável pelo atelier.
          </p>

          {sessionExpired && (
            <p
              role="status"
              className="mt-6 rounded-xl bg-brand-100 p-4 text-sm"
            >
              Sua sessão terminou. Entre novamente para continuar.
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8"
            aria-busy={pending}
          >
            <fieldset
              disabled={pending}
              className="space-y-5"
            >
              <legend className="sr-only">
                Dados de acesso
              </legend>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="admin-input"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold"
                  >
                    Senha
                  </label>

                  <button
                    type="button"
                    aria-controls="password"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs underline underline-offset-4"
                  >
                    {showPassword ? "Ocultar senha" : "Mostrar senha"}
                  </button>
                </div>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="admin-input"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="admin-primary w-full"
              >
                {pending ? "Entrando..." : "Entrar no painel"}
              </button>
            </fieldset>
          </form>

          <p className="mt-6 text-xs leading-5 text-brand-600">
            Acesso exclusivo à administração do atelier.
          </p>
        </div>
      </section>
    </main>
  );
}