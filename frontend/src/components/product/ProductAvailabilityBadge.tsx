interface ProductAvailability {
  active: boolean;
  available: boolean;
  madeToOrder: boolean;
}

interface ProductAvailabilityBadgeProps {
  product: ProductAvailability;
  size?: "sm" | "md";
  className?: string;
}

interface AvailabilityStatus {
  label: string;
  className: string;
}

function getAvailabilityStatus(
  product: ProductAvailability,
): AvailabilityStatus {
  if (!product.active) {
    return {
      label: "Indisponível",
      className: "bg-stone-100 text-stone-700 ring-stone-200",
    };
  }

  if (product.madeToOrder) {
    return {
      label: "Sob encomenda",
      className: "bg-brand-100 text-brand-900 ring-brand-300",
    };
  }

  if (product.available) {
    return {
      label: "Disponível",
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    };
  }

  return {
    label: "Indisponível",
    className: "bg-stone-100 text-stone-700 ring-stone-200",
  };
}

export function ProductAvailabilityBadge({
  product,
  size = "md",
  className = "",
}: ProductAvailabilityBadgeProps) {
  const status = getAvailabilityStatus(product);

  const sizeClassName =
    size === "sm"
      ? "px-2.5 py-1 text-[0.65rem] sm:text-xs"
      : "px-3 py-1.5 text-sm";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
        status.className,
        sizeClassName,
        className,
      ].join(" ")}
    >
      {status.label}
    </span>
  );
}
