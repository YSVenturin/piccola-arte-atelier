import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

interface AdminDialogProps {
  title: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function AdminDialog({
  title,
  busy = false,
  onClose,
  children,
}: AdminDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    dialog.showModal();

    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) {
          onClose();
        }
      }}
      className="m-auto max-h-[90dvh] w-[92vw] max-w-xl overflow-y-auto rounded-2xl border border-brand-200 bg-brand-50 p-6 text-brand-900 shadow-xl backdrop:bg-brand-950/50 sm:p-8"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2
          id={titleId}
          className="font-display text-3xl"
        >
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="admin-secondary"
        >
          Fechar
        </button>
      </div>

      {children}
    </dialog>
  );
}