import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-brand-100/60 p-6 text-center">
      <PackageOpen className="size-10 text-brand-600" aria-hidden="true" />

      <h2 className="mt-4 font-display text-2xl font-semibold text-brand-900">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-brand-700">
        {description}
      </p>
    </div>
  );
}
