import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  const [loopPosition, setLoopPosition] = useState<number | null>(null);
  const [transitions, setTransitions] = useState(true);
  const swiped = useRef(false);
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
  // Copies at both ends let the track loop without cutting a visible photo.
  const trackSlides = multiple
    ? [slides[slides.length - 1], ...slides, ...Array.from({ length: 3 }, (_, index) => slides[index % slides.length])]
    : slides;
  const trackPosition = loopPosition ?? (multiple ? activeIndex + 1 : 0);
  const rotating = multiple && loopPosition === null && !hovered &&
    !keyboardFocused && !hidden && !reducedMotion && !paused;

  const select = useCallback((index: number) => {
    if (!slides.length || loopPosition !== null) return;
    const normalized = (index + slides.length) % slides.length;
    setInteractionVersion((previous) => previous + 1);
    setSelectedId(slides[normalized].product.id);
    if (!reducedMotion && slides.length > 1) {
      if (index === slides.length) setLoopPosition(slides.length + 1);
      else if (index === -1) setLoopPosition(0);
    }
  }, [slides, loopPosition, reducedMotion]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const layout = window.matchMedia("(min-width: 1024px)");
    const onLayoutChange = (event: MediaQueryListEvent) => {
      setWide(event.matches);
      setTransitions(false);
      setLoopPosition(null);
    };
    const onMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      if (event.matches) {
        setTransitions(false);
        setLoopPosition(null);
      }
    };
    const onVisibilityChange = () => setHidden(document.hidden);
    media.addEventListener("change", onMotionChange);
    layout.addEventListener("change", onLayoutChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      media.removeEventListener("change", onMotionChange);
      layout.removeEventListener("change", onLayoutChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timeout = window.setTimeout(() => select(activeIndex + 1), SLIDE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, rotating, select, interactionVersion]);

  useEffect(() => {
    if (transitions) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setTransitions(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [transitions]);

  function markFailed(url: string) {
    setLoopPosition(null);
    setFailedUrls((previous) => new Set(previous).add(url));
  }

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Fotos das peças do atelier"
      className="mx-auto grid max-w-6xl touch-pan-y overflow-hidden rounded-2xl bg-brand-50 shadow-sm md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]"
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
        swiped.current = false;
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
        ) {
          swiped.current = true;
          select(activeIndex + (distance < 0 ? 1 : -1));
        }
      }}
    >
      <div className="flex min-w-0 flex-col justify-center bg-brand-900 px-6 py-7 text-brand-50 sm:px-8 md:px-6 lg:px-8 lg:py-8">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
          Cerâmica fria · feita à mão
        </p>
        <h1 className="mt-4 font-display text-[2rem] font-medium leading-[1.05] tracking-tight sm:text-4xl lg:text-[2.65rem] xl:text-5xl">
          Piccole creazioni,
          <br />
          <span className="italic text-brand-200">grande amore!</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-brand-200">
          Criações para dar personalidade ao seu cantinho e tornar um presente ainda mais especial.
        </p>
        <Link
          to={ROUTES.products}
          className="mt-4 inline-flex min-h-11 w-fit items-center gap-3 rounded-full bg-brand-50 px-5 py-2.5 text-xs font-semibold text-brand-900 transition-colors hover:bg-brand-200 md:mt-5"
        >
          Encontrar minha peça <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex min-w-0 items-center bg-brand-50 p-3">
        <div className={`relative isolate mx-auto w-full overflow-hidden rounded-xl [--slide-gap:0.75rem] ${multiple ? "[--slide-size:88%] lg:[--slide-size:44%]" : "max-w-72 [--slide-size:100%]"}`}>
          {current ? (
            <div
              className={`flex items-start gap-[var(--slide-gap)] ${transitions ? "transition-transform duration-500 ease-out motion-reduce:transition-none" : ""}`}
              style={{ transform: `translateX(calc(${-trackPosition} * (var(--slide-size) + var(--slide-gap))))` }}
              onTransitionEnd={(event) => {
                if (event.target !== event.currentTarget || event.propertyName !== "transform" || loopPosition === null) return;
                setTransitions(false);
                setLoopPosition(null);
              }}
            >
              {trackSlides.map(({ product, url }, index) => {
                const visible = index === trackPosition || (wide && multiple && index === trackPosition + 1);
                const position = multiple ? (index - 1 + slides.length) % slides.length : 0;
                return (
                  <div
                    key={`${index}-${url}`}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${position + 1} de ${slides.length}`}
                    aria-hidden={!visible}
                    className="min-w-0 shrink-0 basis-[var(--slide-size)]"
                  >
                    <Link
                      to={getProductDetailsPath(product.slug)}
                      tabIndex={visible ? 0 : -1}
                      aria-label={`Ver peça: ${product.name}`}
                      onClick={(event) => {
                        if (swiped.current) event.preventDefault();
                      }}
                      onPointerDown={() => { swiped.current = false; }}
                      className="block rounded-xl focus-visible:outline-offset-[-3px]"
                    >
                      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-brand-100">
                        <img
                          src={url}
                          alt={visible ? product.mainImage?.altText?.trim() || product.name : ""}
                          width={1440}
                          height={1920}
                          loading={index <= 3 ? "eager" : "lazy"}
                          fetchPriority={position === 0 ? "high" : "auto"}
                          decoding="async"
                          onError={() => markFailed(url)}
                          className="size-full object-contain"
                        />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-brand-50">
              <img src={primaryLogo} alt="Piccola Arte Atelier" width={500} height={500} className="size-full object-contain" />
              {loading && <span role="status" className="sr-only">Carregando as fotos das peças...</span>}
            </div>
          )}
          {multiple && (
            <>
              <button
                type="button"
                onClick={() => select(activeIndex - 1)}
                disabled={loopPosition !== null}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-950/65 text-white backdrop-blur-sm transition-colors hover:bg-brand-950 disabled:cursor-wait"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => select(activeIndex + 1)}
                disabled={loopPosition !== null}
                aria-label="Próxima foto"
                className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-950/65 text-white backdrop-blur-sm transition-colors hover:bg-brand-950 disabled:cursor-wait"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
                <div className="pointer-events-auto flex max-w-full items-center rounded-full bg-brand-950/75 px-1 text-white backdrop-blur-sm">
                  <div role="group" aria-label="Selecionar foto" className="flex min-w-0 items-center overflow-x-auto">
                    {slides.map(({ product }, index) => (
                      <button
                        key={product.id}
                        type="button"
                        aria-label={`Mostrar foto ${index + 1}: ${product.name}`}
                        aria-current={index === activeIndex ? "true" : undefined}
                        disabled={loopPosition !== null}
                        onClick={() => select(index)}
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full disabled:cursor-wait"
                      >
                        <span aria-hidden="true" className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === activeIndex ? "w-5 bg-accent-200" : "w-2 bg-white/60"}`} />
                      </button>
                    ))}
                  </div>
                  {!reducedMotion && (
                    <button
                      type="button"
                      aria-label={paused ? "Retomar troca automática" : "Pausar troca automática"}
                      onClick={() => {
                        setPaused((previous) => !previous);
                        setKeyboardFocused(false);
                        setHovered(false);
                      }}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
                    >
                      {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
        {current ? `Foto ${activeIndex + 1} de ${slides.length}: ${current.product.name}` : ""}
      </p>
    </div>
  );
}
