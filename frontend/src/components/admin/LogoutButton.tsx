import { useState } from "react";

import { useAuth } from "../../auth/AuthContext";
import { getAuthErrorMessage } from "../../services/authService";

export function LogoutButton() {
  const { signOut } = useAuth();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setPending(true);
    setError("");

    try {
      await signOut();
    } catch (cause) {
      setError(getAuthErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="admin-secondary"
        disabled={pending}
        onClick={handleLogout}
      >
        {pending ? "Saindo..." : "Sair da conta"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 max-w-xs text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}