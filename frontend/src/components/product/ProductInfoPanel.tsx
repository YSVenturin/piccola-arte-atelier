import { Layers3, MessageCircle, Ruler, Sparkles } from "lucide-react";
import { Link } from "react-router";

import { ROUTES } from "../../routes/routePaths";
import type { ProductDetailsDTO } from "../../types/product";
import { formatCurrency } from "../../utils/formatCurrency";
import { ProductAvailabilityBadge } from "./ProductAvailabilityBadge";

interface ProductInfoPanelProps {
  product: ProductDetailsDTO;
}

export function ProductInfoPanel({ product }: ProductInfoPanelProps) {
  const formattedPrice =
    product.priceVisible && product.price !== null
      ? formatCurrency(product.price)
      : null;

  const hasCharacteristics =
    Boolean(product.material) || Boolean(product.dimensions);

  const canRequestProduct =
    product.active && (product.available || product.madeToOrder);

  return (
    <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-sm sm:p-8">
      {product.categories.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Categorias do produto">
          {product.categories.map((category) => (
            <li key={category.id}>
              <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                {category.name}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {product.featured && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-900 px-3 py-1.5 text-sm font-semibold text-brand-50">
            <Sparkles className="size-4" aria-hidden="true" />
            Destaque
          </span>
        )}

        <ProductAvailabilityBadge product={product} />
      </div>

      <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-brand-900 sm:text-5xl">
        {product.name}
      </h1>

      {product.shortDescription && (
        <p className="mt-4 leading-7 text-brand-700">
          {product.shortDescription}
        </p>
      )}

      <div className="mt-7 border-y border-brand-200 py-6">
        {formattedPrice ? (
          <>
            <p className="text-sm font-medium text-brand-600">A partir de</p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-brand-900">
              {formattedPrice}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-brand-600">Preço</p>

            <p className="mt-1 text-xl font-semibold text-brand-900">
              Valor sob consulta
            </p>
          </>
        )}
      </div>

      {hasCharacteristics && (
        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {product.material && (
            <div className="flex gap-3">
              <Layers3
                className="mt-0.5 size-5 shrink-0 text-brand-600"
                aria-hidden="true"
              />

              <div>
                <dt className="text-sm font-semibold text-brand-900">
                  Material
                </dt>

                <dd className="mt-1 text-sm leading-6 text-brand-700">
                  {product.material}
                </dd>
              </div>
            </div>
          )}

          {product.dimensions && (
            <div className="flex gap-3">
              <Ruler
                className="mt-0.5 size-5 shrink-0 text-brand-600"
                aria-hidden="true"
              />

              <div>
                <dt className="text-sm font-semibold text-brand-900">
                  Dimensões
                </dt>

                <dd className="mt-1 text-sm leading-6 text-brand-700">
                  {product.dimensions}
                </dd>
              </div>
            </div>
          )}
        </dl>
      )}

      <div className="mt-8">
        {canRequestProduct ? (
          <Link
            to={ROUTES.contact}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-900 px-6 py-3.5 text-sm font-semibold text-brand-50 transition hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Solicitar esta peça
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-stone-200 px-6 py-3.5 text-sm font-semibold text-stone-600"
          >
            Peça indisponível
          </button>
        )}

        {canRequestProduct && (
          <p className="mt-3 text-center text-xs leading-5 text-brand-600">
            Entre em contato para consultar prazo, personalização e
            disponibilidade.
          </p>
        )}
      </div>
    </div>
  );
}
