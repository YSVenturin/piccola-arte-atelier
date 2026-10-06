import axios from "axios";
import { useEffect, useState } from "react";

import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ProductCard } from "../components/product/ProductCard";
import { getProducts } from "../services/productService";
import type { ProductSummaryDTO } from "../types/product";

import { useSearchParams } from "react-router";

import { getCategories } from "../services/categoryService";
import type { CategoryResponseDTO } from "../types/category";
import { CategoryFilter } from "../components/product/CategoryFilter";

type LoadStatus = "loading" | "success" | "error";

function getProductsErrorMessage(requestError: unknown): string {
  if (!axios.isAxiosError(requestError)) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  if (requestError.code === "ECONNABORTED") {
    return "A conexão demorou mais que o esperado. Verifique sua internet e tente novamente.";
  }

  if (!requestError.response) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }

  if (requestError.response.status >= 500) {
    return "O catálogo está temporariamente indisponível. Tente novamente em alguns instantes.";
  }

  return "Não foi possível carregar os produtos. Tente novamente.";
}

export function ProductListPage() {
  const [products, setProducts] = useState<ProductSummaryDTO[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const [requestVersion, setRequestVersion] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("categoria")?.trim() || undefined;

  const [categories, setCategories] = useState<CategoryResponseDTO[]>([]);

  const [categoriesStatus, setCategoriesStatus] = useState<LoadStatus>("loading");

  const [categoriesRequestVersion, setCategoriesRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setStatus("loading");
      setError(null);

      try {
        const data = await getProducts(
          categorySlug,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setProducts(data);
        setStatus("success");
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Erro ao carregar produtos:", requestError);

        setError(getProductsErrorMessage(requestError));
        setStatus("error");
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [categorySlug, requestVersion]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setCategoriesStatus("loading");

      try {
        const data = await getCategories(controller.signal);

        if (controller.signal.aborted) return;

        setCategories(data);
        setCategoriesStatus("success");
      } catch (requestError) {
        if (controller.signal.aborted) return;

        console.error("Erro ao carregar categorias:", requestError);
        setCategoriesStatus("error");
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, [categoriesRequestVersion]);

  function handleCategoryChange(nextCategorySlug: string) {
    const params = new URLSearchParams(searchParams);

    if (nextCategorySlug) {
      params.set("categoria", nextCategorySlug);
    } else {
      params.delete("categoria");
    }

    setSearchParams(params);
  }

  function handleRetry() {
    setError(null);
    setStatus("loading");

    setRequestVersion((currentVersion) => currentVersion + 1);
  }

  const productCountLabel =
    products.length === 1
      ? "1 peça encontrada"
      : `${products.length} peças encontradas`;

  return (
    <section className="py-8 sm:py-12">
      <PageContainer>
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
            Catálogo
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold text-brand-900 sm:text-6xl">
            Peças artesanais
          </h1>

          <p className="mt-4 leading-7 text-brand-700">
            Conheça as criações da Piccola Arte, produzidas à mão com cuidado em
            cada detalhe.
          </p>
        </header>

        <CategoryFilter
          categories={categories}
          selectedSlug={categorySlug}
          status={categoriesStatus}
          onChange={handleCategoryChange}
          onRetry={() =>
            setCategoriesRequestVersion((current) => current + 1)
          }
        />

        <div className="mt-10" aria-busy={status === "loading"}>
          {status === "loading" && (
            <LoadingSpinner />
          )}

          {status === "error" && error && (
            <ErrorMessage title="Não foi possível carregar o catálogo" message={error} onRetry={handleRetry} />
          )}

          {status === "success" && products.length === 0 && (
            <EmptyState
              title="Nenhuma peça encontrada"
              description={
                categorySlug
                  ? "Nenhuma peça encontrada nesta categoria."
                  : "Ainda não existem produtos disponíveis no catálogo."
              }
            />
          )}

          {status === "success" && products.length > 0 && (
            <section aria-labelledby="catalog-results-title">
              <div className="mb-5 flex items-center justify-between">
                <h2
                  id="catalog-results-title"
                  className="text-sm font-medium text-brand-700"
                >
                  {productCountLabel}
                </h2>
              </div>

              <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <li key={product.id} className="min-w-0">
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </PageContainer>
    </section>
  );
}
