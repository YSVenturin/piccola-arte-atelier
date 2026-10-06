import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useEffect, useId, useRef, useState } from "react";

import type { CategoryResponseDTO } from "../../types/category";

interface CategoryFilterProps {
  categories: CategoryResponseDTO[];
  selectedSlug?: string;
  status: "loading" | "success" | "error";
  onChange: (slug: string) => void;
  onRetry: () => void;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CategoryFilter({
  categories,
  selectedSlug,
  status,
  onChange,
  onRetry,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const id = useId();
  const panelId = `${id}-panel`;
  const searchId = `${id}-search`;

  useEffect(() => {
    if (isOpen && status === "success") {
      searchRef.current?.focus();
    }
  }, [isOpen, status]);

  const selectedCategory = categories.find(
    (category) => category.slug === selectedSlug,
  );

  const selectedName =
    selectedCategory?.name ??
    (status === "success"
      ? "Categoria não encontrada"
      : "Categoria selecionada");

  const normalizedSearch = normalizeText(search.trim());

  const filteredCategories = categories.filter((category) =>
    normalizeText(category.name).includes(normalizedSearch),
  );

  const options = [
    { slug: "", name: "Todas as peças" },
    ...filteredCategories,
  ];

  function closePanel() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function selectCategory(slug: string) {
    onChange(slug);
    setSearch("");
    closePanel();
  }

  return (
    <section className="mt-8" aria-label="Filtro por categoria">
      <div className="flex flex-wrap items-center gap-3">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => {
            setSearch("");
            setIsOpen((current) => !current);
          }}
          className="
            inline-flex min-h-12 w-full items-center justify-between
            gap-5 rounded-2xl border border-brand-400 bg-brand-50
            px-4 py-3 text-sm font-semibold text-brand-900
            shadow-sm transition hover:border-brand-600
            hover:bg-brand-100 sm:w-auto
          "
        >
          <span className="inline-flex items-center gap-2.5">
            <SlidersHorizontal
              className="size-4 shrink-0"
              aria-hidden="true"
            />

            Explorar categorias
          </span>

          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {selectedSlug ? (
          <button
            type="button"
            onClick={() => selectCategory("")}
            aria-label={`Remover filtro: ${selectedName}`}
            className="
              inline-flex min-h-11 max-w-full items-center gap-2
              rounded-full border border-brand-200 bg-brand-100
              px-3.5 py-2 text-sm text-brand-800
              transition hover:bg-brand-200
            "
          >
            <span className="min-w-0 truncate">
              {selectedName}
            </span>

            <X
              className="size-3.5 shrink-0"
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="text-sm text-brand-600">
            Todas as categorias
          </span>
        )}
      </div>

      <div
        id={panelId}
        hidden={!isOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closePanel();
          }
        }}
        className="
          mt-4 max-w-5xl rounded-3xl border border-brand-200
          bg-white/80 p-4 shadow-sm sm:p-6
        "
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold text-brand-900">
            O que você procura?
          </h2>

          <button
            type="button"
            onClick={closePanel}
            aria-label="Fechar categorias"
            className="
              inline-flex size-11 shrink-0 items-center justify-center
              rounded-full bg-brand-100 text-brand-800
              transition hover:bg-brand-200
            "
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {status === "loading" && (
          <p role="status" className="py-6 text-sm text-brand-600">
            Carregando categorias...
          </p>
        )}

        {status === "error" && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
            <p role="alert">
              Não foi possível carregar as categorias.
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-2 min-h-11 font-semibold underline underline-offset-4"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {status === "success" && (
          <>
            <label htmlFor={searchId} className="sr-only">
              Buscar categoria
            </label>

            <div className="relative mb-5">
              <Search
                aria-hidden="true"
                className="
                  pointer-events-none absolute left-3.5 top-1/2
                  size-4 -translate-y-1/2 text-brand-600
                "
              />

              <input
                ref={searchRef}
                id={searchId}
                type="search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar uma categoria..."
                className="
                  min-h-12 w-full rounded-xl border border-brand-200
                  bg-brand-50 py-3 pl-10 pr-4 text-base
                  text-brand-900 placeholder:text-brand-600
                "
              />
            </div>

            <div
              role="group"
              aria-label="Escolha uma categoria"
              className="
                grid max-h-80 grid-cols-2 gap-2.5 overflow-y-auto
                overscroll-contain p-1 sm:grid-cols-3 lg:grid-cols-4
              "
            >
              {options.map((category) => {
                const isSelected =
                  (selectedSlug ?? "") === category.slug;

                return (
                  <button
                    key={category.slug}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectCategory(category.slug)}
                    className={`
                      flex min-h-16 min-w-0 items-center gap-2
                      rounded-2xl border px-3 py-3 text-left
                      text-sm font-medium transition
                      ${
                        isSelected
                          ? "border-brand-900 bg-brand-900 text-brand-50"
                          : "border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-400 hover:bg-brand-100"
                      }
                    `}
                  >
                    {isSelected ? (
                      <Check
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowUpRight
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}

                    <span className="min-w-0 break-words">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredCategories.length === 0 && (
              <p role="status" className="mt-4 text-sm text-brand-600">
                {categories.length === 0
                  ? "Ainda não há categorias disponíveis."
                  : "Nenhuma categoria encontrada para essa busca."}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}