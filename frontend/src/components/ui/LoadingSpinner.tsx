import { LoaderCircle } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center gap-3 text-brand-700"
    >
      <LoaderCircle className="size-8 animate-spin" aria-hidden="true" />

      <span className="text-sm font-medium">Carregando...</span>
    </div>
  );
}
