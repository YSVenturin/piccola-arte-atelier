import { ArrowRight, ImageOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { getProductDetailsPath } from "../../routes/routePaths";
import type { ProductSummaryDTO } from "../../types/product";
import { formatCurrency } from "../../utils/formatCurrency";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { ProductAvailabilityBadge } from "./ProductAvailabilityBadge";

interface ProductCardProps {
  product: ProductSummaryDTO;
}

export function ProductCard({ product }: ProductCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = resolveImageUrl(product.mainImage?.url);
  const shouldDisplayImage = imageUrl !== null && !hasImageError;
  const imageAlt = product.mainImage?.altText?.trim() || product.name;
  const formattedPrice =
    product.priceVisible && product.price !== null
      ? formatCurrency(product.price)
      : null;
  const primaryCategory = product.categories[0];

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2">
      <Link
        to={getProductDetailsPath(product.slug)}
        className="flex h-full flex-col focus:outline-none"
      >
        <div className="relative aspect-square overflow-hidden bg-brand-100">
          {shouldDisplayImage ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              onError={() => setHasImageError(true)}
              className="size-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-brand-500">
              <ImageOff className="size-8" aria-hidden="true" />

              <span className="text-xs font-medium">Imagem indisponível</span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2 sm:inset-x-3 sm:top-3">
            <ProductAvailabilityBadge
              product={product}
              size="sm"
              className="ml-auto shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-5">
          {primaryCategory && (
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-xs">
              {primaryCategory.name}
            </p>
          )}

          <h2 className="mt-1 line-clamp-2 font-display text-lg font-semibold leading-tight text-brand-900 sm:text-xl">
            {product.name}
          </h2>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-brand-700 sm:text-sm sm:leading-6">
            {product.shortDescription ??
              "Peça artesanal produzida com cuidado em cada detalhe."}
          </p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <div>
              {formattedPrice ? (
                <>
                  <p className="text-[0.65rem] text-brand-600 sm:text-xs">
                    A partir de
                  </p>

                  <p className="text-sm font-bold text-brand-900 sm:text-base">
                    {formattedPrice}
                  </p>
                </>
              ) : (
                <p className="text-xs font-semibold text-brand-700 sm:text-sm">
                  Valor sob consulta
                </p>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-800 sm:text-sm">
              <span className="hidden sm:inline">Ver detalhes</span>

              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
