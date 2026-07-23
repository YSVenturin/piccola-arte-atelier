import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";

import { PageContainer } from "../components/layout/PageContainer";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ProductGallery } from "../components/product/ProductGallery";
import { ROUTES } from "../routes/routePaths";
import { getProductBySlug } from "../services/productService";
import type { ProductDetailsDTO } from "../types/product";

import { ProductInfoPanel } from "../components/product/ProductInfoPanel";

type LoadStatus = "loading" | "success" | "error" | "not-found";

function getProductErrorMessage(requestError: unknown): string {
  if (!axios.isAxiosError(requestError)) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  if (
    requestError.code === "ECONNABORTED" ||
    requestError.code === "ETIMEDOUT"
  ) {
    return "A conexão demorou mais que o esperado. Verifique sua internet e tente novamente.";
  }

  if (!requestError.response) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }

  if (requestError.response.status >= 500) {
    return "O produto está temporariamente indisponível. Tente novamente em alguns instantes.";
  }

  return "Não foi possível carregar as informações deste produto.";
}

export function ProductDetailsPage() {
  const { slug } = useParams<"slug">();
  const [product, setProduct] = useState<ProductDetailsDTO | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const productSlug = slug;
    const controller = new AbortController();

    async function loadProduct() {
      setStatus("loading");
      setError(null);

      try {
        const data = await getProductBySlug(productSlug, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setProduct(data);
        setStatus("success");
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Erro ao carregar detalhes do produto:", requestError);

        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 404
        ) {
          setProduct(null);
          setStatus("not-found");
          return;
        }

        setProduct(null);
        setError(getProductErrorMessage(requestError));
        setStatus("error");
      }
    }

    void loadProduct();

    return () => {
      controller.abort();
    };
  }, [slug, requestVersion]);

  if (!slug) {
    return <Navigate to={ROUTES.products} replace />;
  }

  function handleRetry() {
    setRequestVersion((currentVersion) => currentVersion + 1);
  }

  if (status === "loading") {
    return (
      <section className="py-12 sm:py-16" aria-busy="true">
        <PageContainer>
          <LoadingSpinner />
        </PageContainer>
      </section>
    );
  }

  if (status === "not-found") {
    return (
      <section className="flex min-h-[60vh] items-center py-16 text-center">
        <PageContainer>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">
            Produto não encontrado
          </p>

          <h1 className="mt-4 font-display text-5xl font-semibold text-brand-900 sm:text-6xl">
            Esta peça não está disponível
          </h1>

          <p className="mx-auto mt-5 max-w-lg leading-7 text-brand-700">
            O produto pode ter sido removido, desativado ou o endereço acessado
            está incorreto.
          </p>

          <Link
            to={ROUTES.products}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-brand-50 transition hover:bg-brand-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para o catálogo
          </Link>
        </PageContainer>
      </section>
    );
  }

  if (status === "error" && error) {
    return (
      <section className="py-12 sm:py-16">
        <PageContainer>
          <ErrorMessage
            title="Não foi possível carregar o produto"
            message={error}
            onRetry={handleRetry}
          />
        </PageContainer>
      </section>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12">
      <PageContainer>
        <Link
          to={ROUTES.products}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para o catálogo
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,32rem)_minmax(20rem,1fr)] lg:items-start lg:justify-center lg:gap-12">
          <ProductGallery
            key={product.id}
            images={product.images}
            productName={product.name}
          />

          <ProductInfoPanel product={product} />
        </div>

        {product.description && (
          <section
            className="mt-8 border-t border-brand-200 pt-10 sm:mt-12 sm:pt-12"
            aria-labelledby="product-description-title"
          >
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
                Detalhes da peça
              </p>

              <h2
                id="product-description-title"
                className="mt-3 font-display text-3xl font-semibold text-brand-900 sm:text-4xl"
              >
                Sobre esta criação
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-brand-700">
                {product.description}
              </p>
            </div>
          </section>
        )}
      </PageContainer>
    </section>
  );
}
