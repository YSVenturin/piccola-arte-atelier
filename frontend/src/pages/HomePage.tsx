import { InstagramIcon } from "../components/ui/InstagramIcon";
import {
  Gift,
  HandHeart,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import { HomeCareGuide } from "../components/home/HomeCareGuide";
import { HomeProductCarousel } from "../components/home/HomeProductCarousel";
import { PageContainer } from "../components/layout/PageContainer";
import { ATELIER, getWhatsAppUrl } from "../config/atelier";
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

  // Use todas as capas em destaque; sem destaques, use as capas do catálogo.
  const carouselProducts = useMemo(() => {
    const withPhotos = products.filter((product) => product.mainImage?.url);
    const featuredWithPhotos = withPhotos.filter((product) => product.featured);
    return featuredWithPhotos.length ? featuredWithPhotos : withPhotos;
  }, [products]);

  return (
    <>
      {/* Abertura compacta, com fotos automáticas e controles manuais. */}
      <section
        aria-label="Conheça a Piccola Arte"
        className="bg-white pb-5 pt-5 sm:pt-6"
      >
        <PageContainer>
          <div className="min-w-0">
            <HomeProductCarousel
              products={carouselProducts}
              loading={status === "loading"}
            />
            {status === "error" && (
              <div role="alert" className="mt-4 rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm text-brand-800">
                <p>Não foi possível carregar as peças agora.</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("loading");
                    setAttempt((previous) => previous + 1);
                  }}
                  className="mt-1 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
                >
                  Tentar novamente
                </button>
              </div>
            )}
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

      <section aria-labelledby="home-care-title" className="bg-white pb-7 pt-1 sm:pb-9">
        <PageContainer>
          <div className="min-w-0">
            <HomeCareGuide />
          </div>
        </PageContainer>
      </section>

      {/* Contatos reais: WhatsApp para encomendas e Instagram para acompanhar. */}
      <section
        aria-labelledby="home-contact-title"
        className="bg-white pb-9 sm:pb-10"
      >
        <PageContainer>
          <div className="min-w-0">
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
