import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import primaryLogo from "../../assets/images/brand/brand-logo-primary.jpeg";
import { getProductDetailsPath, ROUTES } from "../../routes/routePaths";
import type { ProductSummaryDTO } from "../../types/product";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

// Tempo entre as fotos. 5.000 milissegundos = 5 segundos.
const SLIDE_DURATION = 5_000;

interface HomeProductCarouselProps {
  products: ProductSummaryDTO[];
  loading: boolean;
}

export function HomeProductCarousel({
  products,
  loading,
}: HomeProductCarouselProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const [interactionVersion, setInteractionVersion] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const slides = useMemo(() => {
    const usedUrls = new Set<string>();
    return products.flatMap((product) => {
      let url: string | null;
      try {
        url = resolveImageUrl(product.mainImage?.url);
      } catch {
        return [];
      }
      if (!url || failedUrls.has(url) || usedUrls.has(url)) return [];
      usedUrls.add(url);
      return [{ product, url }];
    });
  }, [products, failedUrls]);

  const activeIndex = Math.max(
    0,
    slides.findIndex(({ product }) => product.id === selectedId),
  );
  const current = slides[activeIndex];
  const multiple = slides.length > 1;
  const rotating =
    multiple && !hovered && !keyboardFocused && !hidden && !reducedMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    const onVisibilityChange = () => setHidden(document.hidden);
    media.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      media.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timeout = window.setTimeout(() => {
      setSelectedId(slides[(activeIndex + 1) % slides.length].product.id);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, rotating, slides, interactionVersion]);

  function select(index: number) {
    if (!slides.length) return;
    setInteractionVersion((previous) => previous + 1);
    setSelectedId(slides[(index + slides.length) % slides.length].product.id);
  }

  function markFailed(url: string) {
    setFailedUrls((previous) => new Set(previous).add(url));
  }

  return (
    <div className="grid overflow-hidden rounded-2xl bg-brand-900 shadow-sm md:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-center px-6 py-7 text-white sm:px-8 md:py-8 lg:px-10">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-200">
          Cerâmica fria · feita à mão
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium leading-[1.02] sm:text-5xl lg:text-6xl">
          Piccole creazioni,
          <br />
          <span className="italic text-accent-200">grande amore!</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-7 text-brand-200">
          Criações para dar personalidade ao seu cantinho e tornar um presente
          ainda mais especial.
        </p>
        <Link
          to={ROUTES.products}
          className="mt-5 inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-brand-50 px-6 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-200"
        >
          Encontrar minha peça{" "}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div
        role="region"
        aria-roledescription="carrossel"
        aria-label="Fotos das peças do atelier"
        className="relative isolate min-h-64 touch-pan-y overflow-hidden bg-accent-100 sm:min-h-80 md:min-h-90 lg:min-h-96"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={() => setKeyboardFocused(false)}
        onFocusCapture={(event) => {
          setKeyboardFocused(
            event.target instanceof HTMLElement &&
              event.target.matches(":focus-visible"),
          );
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setKeyboardFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          setKeyboardFocused(true);
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            select(activeIndex + (event.key === "ArrowLeft" ? -1 : 1));
          }
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = touch
            ? { x: touch.clientX, y: touch.clientY }
            : null;
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0];
          touchStart.current = null;
          if (!start || !end) return;
          const distance = end.clientX - start.x;
          if (
            Math.abs(distance) > 50 &&
            Math.abs(distance) > Math.abs(end.clientY - start.y)
          )
            select(activeIndex + (distance < 0 ? 1 : -1));
        }}
      >
        {slides.map(({ product, url }, index) => (
          <div
            key={url}
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <img
              src={url}
              alt={
                index === activeIndex
                  ? product.mainImage?.altText?.trim() || product.name
                  : ""
              }
              width={1000}
              height={750}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
              onError={() => markFailed(url)}
              className="size-full object-cover"
            />
          </div>
        ))}

        {!current && (
          <div className="absolute inset-0 bg-brand-50">
            <img
              src={primaryLogo}
              alt="Piccola Arte Atelier"
              width={500}
              height={500}
              className="size-full object-contain"
            />
            {loading && (
              <span role="status" className="sr-only">
                Carregando as fotos das peças...
              </span>
            )}
          </div>
        )}

        {current && (
          <Link
            to={getProductDetailsPath(current.product.slug)}
            aria-label={`Ver peça: ${current.product.name}`}
            className={`absolute inset-x-4 flex items-center justify-between gap-3 rounded-xl bg-brand-950/50 px-4 py-3 text-white backdrop-blur-sm ${multiple ? "bottom-17" : "bottom-4"}`}
          >
            <span className="min-w-0">
              <span className="mt-1 block truncate font-display text-xl font-semibold sm:text-2xl">
                {current.product.name}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        )}

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => select(activeIndex - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-[32%] inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-950/65 text-white backdrop-blur-sm hover:bg-brand-950"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => select(activeIndex + 1)}
              aria-label="Próxima foto"
              className="absolute right-3 top-[32%] inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-950/65 text-white backdrop-blur-sm hover:bg-brand-950"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <div className="absolute inset-x-3 bottom-3 flex justify-center">
              <div className="flex max-w-full items-center rounded-full bg-brand-950/80 px-2 py-1 text-white backdrop-blur-sm">
                <div
                  className="flex items-center"
                  role="group"
                  aria-label="Selecionar foto"
                >
                  {slides.map(({ product }, index) => (
                    <button
                      key={product.id}
                      type="button"
                      aria-label={`Mostrar foto ${index + 1}: ${product.name}`}
                      aria-current={index === activeIndex ? "true" : undefined}
                      onClick={() => select(index)}
                      className="inline-flex size-8 items-center justify-center rounded-full"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === activeIndex ? "w-5 bg-accent-200" : "w-2 bg-white/60"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        <p
          className="sr-only"
          aria-live={rotating ? "off" : "polite"}
          aria-atomic="true"
        >
          {current
            ? `Foto ${activeIndex + 1} de ${slides.length}: ${current.product.name}`
            : ""}
        </p>
      </div>
    </div>
  );
}
