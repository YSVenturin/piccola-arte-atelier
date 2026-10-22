import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import careCover from "../../assets/images/care/cuidados-1.jpg";
import careWater from "../../assets/images/care/cuidados-2.jpg";
import careFood from "../../assets/images/care/cuidados-3.jpg";
import careCleaning from "../../assets/images/care/cuidados-4.jpg";
import careClosing from "../../assets/images/care/cuidados-5.jpg";
import { ATELIER } from "../../config/atelier";
import { InstagramIcon } from "../ui/InstagramIcon";

// As cinco artes da publicação, na ordem e com a numeração originais.
const CARE_SLIDES = [
  {
    src: careCover,
    title: "Três cuidados com sua peça de cerâmica fria",
    description: "Capa do guia: três cuidados com sua peça de cerâmica fria. Piccola Arte Atelier.",
  },
  {
    src: careWater,
    title: "Evite contato com água",
    description: "A cerâmica fria não é totalmente impermeável, então mantenha sua peça longe da água para evitar danos.",
  },
  {
    src: careFood,
    title: "Não utilize em contato com alimentos",
    description: "Peças de cerâmica fria são decorativas e não são indicadas para uso com comida ou bebidas.",
  },
  {
    src: careCleaning,
    title: "Limpe apenas com pano seco ou levemente úmido",
    description: "Não utilize produtos químicos. Um pano macio é suficiente para remover poeira e manter sua peça limpa.",
  },
  {
    src: careClosing,
    title: "Cuide bem da sua peça artesanal!",
    description: "Com esses cuidados simples, sua cerâmica fria vai continuar linda por muito mais tempo!",
  },
];

export function HomeCareGuide() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const slideButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const expanded = expandedIndex !== null;
  const expandedSlide = CARE_SLIDES[expandedIndex ?? activeIndex];
  // Ao chegar ao fim, mantenha as duas últimas artes inteiras no computador.
  const firstVisibleIndex = Math.min(activeIndex, CARE_SLIDES.length - (wide ? 2 : 1));

  useEffect(() => {
    const layout = window.matchMedia("(min-width: 1024px)");
    const onLayoutChange = (event: MediaQueryListEvent) => setWide(event.matches);
    layout.addEventListener("change", onLayoutChange);
    return () => layout.removeEventListener("change", onLayoutChange);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, [expanded]);

  function select(index: number) {
    setActiveIndex(Math.max(0, Math.min(CARE_SLIDES.length - 1, index)));
  }

  function selectExpanded(index: number) {
    const nextIndex = Math.max(0, Math.min(CARE_SLIDES.length - 1, index));
    select(nextIndex);
    setExpandedIndex(nextIndex);
  }

  const arrowClass = "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-900/85 text-white backdrop-blur-sm transition-colors hover:bg-brand-950 disabled:cursor-default disabled:opacity-35";

  return (
    <div className="grid w-full min-w-0 items-center gap-6 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-6 sm:px-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:px-9 lg:py-7">
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent-700">
          Carinho que continua
        </p>
        <h2 id="home-care-title" className="mt-3 max-w-sm font-display text-4xl font-semibold leading-[1.05] text-brand-950 lg:text-5xl">
          Cuidados com sua peça
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-7 text-brand-800 sm:text-base">
          Pequenos cuidados ajudam a preservar sua peça artesanal por muito mais tempo.
        </p>
        <a
          href={ATELIER.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:text-brand-950"
        >
          <InstagramIcon className="size-5 shrink-0" aria-hidden="true" />
          Mais no Instagram
          <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
        </a>
      </div>

      <div
        role="region"
        aria-roledescription="carrossel"
        aria-label="Guia de cuidados com a cerâmica fria"
        tabIndex={0}
        className="mx-auto w-full min-w-0 max-w-80 touch-pan-y [--care-slide-size:88%] md:max-w-none lg:[--care-slide-size:44%]"
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            select(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            select(event.key === "Home" ? 0 : CARE_SLIDES.length - 1);
          }
        }}
        onTouchStart={(event) => {
          swiped.current = false;
          const touch = event.touches[0];
          touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0];
          touchStart.current = null;
          if (!start || !end) return;
          const distance = end.clientX - start.x;
          if (Math.abs(distance) > 50 && Math.abs(distance) > Math.abs(end.clientY - start.y)) {
            swiped.current = true;
            select(activeIndex + (distance < 0 ? 1 : -1));
          }
        }}
      >
        <div className="relative isolate overflow-clip rounded-xl">
          <div
            className="flex items-start gap-3 transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(calc(${-firstVisibleIndex} * (var(--care-slide-size) + 0.75rem)))` }}
          >
            {CARE_SLIDES.map((slide, index) => (
              <div
                key={slide.src}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${CARE_SLIDES.length}`}
                aria-hidden={index < firstVisibleIndex || index >= firstVisibleIndex + (wide ? 2 : 1)}
                className="min-w-0 shrink-0 basis-[var(--care-slide-size)]"
              >
                <button
                  ref={(element) => { slideButtons.current[index] = element; }}
                  type="button"
                  aria-label={`Ampliar imagem ${index + 1}: ${slide.title}`}
                  aria-haspopup="dialog"
                  tabIndex={index >= firstVisibleIndex && index < firstVisibleIndex + (wide ? 2 : 1) ? 0 : -1}
                  onPointerDown={() => { swiped.current = false; }}
                  onClick={() => {
                    if (swiped.current) return;
                    select(index);
                    setExpandedIndex(index);
                  }}
                  className="block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-xl bg-brand-100 focus-visible:outline-offset-[-3px]"
                >
                  <img
                    src={slide.src}
                    alt={`${slide.title}. ${slide.description}`}
                    width={1080}
                    height={1350}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-contain"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Cuidado anterior"
            disabled={activeIndex === 0}
            onClick={() => select(activeIndex - 1)}
            className={arrowClass}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <div role="group" aria-label="Selecionar imagem do guia" className="flex min-w-0 items-center justify-center">
            {CARE_SLIDES.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Mostrar cuidado ${index + 1}: ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => select(index)}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full sm:size-9"
              >
                <span aria-hidden="true" className={`size-2 rounded-full ${index === activeIndex ? "bg-brand-900" : "bg-brand-300"}`} />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Próximo cuidado"
            disabled={activeIndex === CARE_SLIDES.length - 1}
            onClick={() => select(activeIndex + 1)}
            className={arrowClass}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Imagem {activeIndex + 1} de {CARE_SLIDES.length}: {CARE_SLIDES[activeIndex].title}
        </p>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="home-care-dialog-title"
        onClose={() => {
          setExpandedIndex(null);
          slideButtons.current[activeIndex]?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setExpandedIndex(null);
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            selectExpanded((expandedIndex ?? activeIndex) + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh_-_1rem)] w-[calc(100%_-_1rem)] max-w-xl overflow-auto rounded-2xl border-0 bg-brand-50 p-3 text-brand-900 shadow-xl backdrop:bg-brand-950/80 sm:p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 id="home-care-dialog-title" className="font-display text-2xl font-semibold">Cuidados com sua peça</h3>
          <button type="button" aria-label="Fechar guia" onClick={() => setExpandedIndex(null)} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-brand-200" autoFocus>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <img src={expandedSlide.src} alt={`${expandedSlide.title}. ${expandedSlide.description}`} width={1080} height={1350} className="mx-auto block max-h-[calc(100dvh_-_10rem)] w-auto max-w-full rounded-lg object-contain" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <button type="button" aria-label="Imagem anterior ampliada" disabled={expandedIndex === 0} onClick={() => selectExpanded((expandedIndex ?? 0) - 1)} className={arrowClass}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <p className="text-center text-xs text-brand-700" aria-live="polite" aria-atomic="true">{expandedSlide.title}</p>
          <button type="button" aria-label="Próxima imagem ampliada" disabled={expandedIndex === CARE_SLIDES.length - 1} onClick={() => selectExpanded((expandedIndex ?? 0) + 1)} className={arrowClass}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </dialog>
    </div>
  );
}
