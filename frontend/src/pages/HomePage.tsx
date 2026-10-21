import { InstagramIcon } from "../components/ui/InstagramIcon";
import {
  ArrowRight,
  Gift,
  HandHeart,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FaWhatsapp } from "react-icons/fa";

import { HomeProductCarousel } from "../components/home/HomeProductCarousel";
import { PageContainer } from "../components/layout/PageContainer";
import { ProductCard } from "../components/product/ProductCard";
import { ATELIER, getWhatsAppUrl } from "../config/atelier";
import { ROUTES } from "../routes/routePaths";
import { getProducts } from "../services/productService";
import type { ProductSummaryDTO } from "../types/product";

type LoadStatus = "loading" | "success" | "error";

export function HomePage() {
  const [products, setProducts] = useState<ProductSummaryDTO[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      try {
        const data = await getProducts(undefined, controller.signal);
        if (!controller.signal.aborted) {
          setProducts(data.filter((product) => product.active));
          setStatus("success");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, [attempt]);

  // O carrossel usa até seis capas, priorizando os destaques do painel.
  const carouselProducts = useMemo(
    () =>
      [
        ...products.filter(
          (product) => product.featured && product.mainImage?.url,
        ),
        ...products.filter(
          (product) => !product.featured && product.mainImage?.url,
        ),
      ].slice(0, 6),
    [products],
  );

  const featured = products.filter((product) => product.featured);
  const selection = [
    ...featured,
    ...products.filter((product) => !product.featured),
  ].slice(0, 4);
  const selectionColumns =
    selection.length === 1
      ? "mx-auto max-w-sm grid-cols-1"
      : selection.length === 2
        ? "mx-auto max-w-2xl grid-cols-2"
        : selection.length === 3
          ? "grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4";

  return (
    <>
      {/* Abertura compacta, com fotos automáticas e controles manuais. */}
      <section
        aria-label="Conheça a Piccola Arte"
        className="bg-white pb-5 pt-5 sm:pt-6"
      >
        <PageContainer>
          <div className="mx-auto max-w-7xl px-2 sm:px-0">
            <HomeProductCarousel
              products={carouselProducts}
              loading={status === "loading"}
            />
            <div className="mt-4 grid grid-cols-3 gap-2 border-b border-brand-200 pb-4 text-center text-[0.65rem] font-semibold text-brand-700 sm:gap-5 sm:text-sm">
              {[
                { icon: HandHeart, label: "Feito à mão" },
                { icon: Sparkles, label: "Para decorar" },
                { icon: Gift, label: "Para presentear" },
              ].map(({ icon: Icon, label }) => (
                <p
                  key={label}
                  className="flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <Icon
                    className="size-4 shrink-0 text-accent-600 sm:size-5"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  {label}
                </p>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Produtos próximos da abertura, com pouco espaço entre os blocos. */}
      <section
        aria-labelledby="home-products-title"
        className="bg-white pb-9 pt-3 sm:pb-10"
      >
        <PageContainer>
          <div className="mx-auto max-w-7xl px-2 sm:px-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent-600">
                  Do atelier para o seu cantinho
                </p>
                <h2
                  id="home-products-title"
                  className="mt-2 font-display text-3xl font-semibold leading-tight text-brand-950 sm:text-4xl"
                >
                  {featured.length
                    ? "Peças que merecem um olhar de perto"
                    : "Encontre o seu próximo encanto"}
                </h2>
              </div>
              <Link
                to={ROUTES.products}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-700 underline decoration-accent-200 underline-offset-4 hover:text-accent-800"
              >
                Ver todas as peças{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div aria-busy={status === "loading"}>
              {status === "loading" && (
                <div role="status">
                  <span className="sr-only">Carregando as peças...</span>
                  <div
                    aria-hidden="true"
                    className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
                  >
                    {[0, 1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="overflow-hidden rounded-2xl border border-brand-200 bg-white motion-safe:animate-pulse"
                      >
                        <div className="aspect-square bg-accent-50" />
                        <div className="space-y-2 p-4">
                          <div className="h-4 w-3/4 rounded bg-brand-100" />
                          <div className="h-3 w-1/2 rounded bg-brand-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {status === "success" && selection.length > 0 && (
                <ul
                  className={`grid gap-x-3 gap-y-5 sm:gap-5 ${selectionColumns}`}
                >
                  {selection.map((product) => (
                    <li key={product.id} className="min-w-0">
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
              )}

              {status === "success" && selection.length === 0 && (
                <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6">
                  <h3 className="font-display text-2xl font-semibold text-brand-950">
                    Sua próxima peça pode começar com uma conversa.
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-brand-700">
                    Fale com o atelier para consultar as criações e
                    possibilidades de encomenda.
                  </p>
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-700 underline underline-offset-4"
                  >
                    Conversar pelo WhatsApp{" "}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              )}

              {status === "error" && (
                <div
                  role="alert"
                  className="rounded-2xl border border-accent-200 bg-accent-50 p-5"
                >
                  <p className="text-sm leading-7 text-brand-800">
                    Não foi possível carregar as peças agora. Tente novamente ou
                    converse com o atelier pelo WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("loading");
                      setAttempt((previous) => previous + 1);
                    }}
                    className="mt-2 min-h-11 text-sm font-semibold text-accent-700 underline underline-offset-4"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Contatos reais: WhatsApp para encomendas e Instagram para acompanhar. */}
      <section
        aria-labelledby="home-contact-title"
        className="bg-white pb-9 sm:pb-10"
      >
        <PageContainer>
          <div className="mx-auto max-w-7xl px-2 sm:px-0">
            <div className="grid items-center gap-5 rounded-2xl border border-accent-200 bg-accent-100 px-5 py-6 sm:px-7 md:grid-cols-[1fr_auto] md:gap-8">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent-700">
                  Escolheu uma peça ou tem uma ideia?
                </p>
                <h2
                  id="home-contact-title"
                  className="mt-2 font-display text-3xl font-semibold text-brand-950 sm:text-4xl"
                >
                  Vamos conversar sobre a sua encomenda.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-brand-800">
                  Consulte disponibilidade, personalização e prazos. Cada
                  detalhe começa com uma boa conversa.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:flex-col">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
                >
                  <FaWhatsapp className="size-5" aria-hidden="true" />
                  Falar no WhatsApp
                </a>
                <a
                  href={ATELIER.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent-300 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-white"
                >
                  <InstagramIcon className="size-4" aria-hidden="true" />
                  Ver o Instagram
                </a>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
