import { CircleAlert, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "Não foi possível carregar o conteúdo",
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <CircleAlert className="size-9 text-red-700" aria-hidden="true" />

      <h2 className="mt-4 font-display text-2xl font-semibold text-red-950">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-red-800">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-900"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
