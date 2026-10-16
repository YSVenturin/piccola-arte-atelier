import { useState } from "react";
import type { FormEvent } from "react";

import type {
  AdminProductResponseDTO,
  ProductRequestDTO,
} from "../../types/adminProduct";
import type { CategoryResponseDTO } from "../../types/category";
import { getProductErrorMessage } from "../../services/adminProductService";
import { AdminDialog } from "./AdminDialog";
import { generateSlug } from "../../utils/slugs";

const textFields = [
  {
    name: "name",
    label: "Nome",
    max: 120,
    rows: 1,
    required: true,
  },
  {
    name: "shortDescription",
    label: "Resumo",
    max: 200,
    rows: 2,
    required: false,
  },
  {
    name: "description",
    label: "Descrição completa",
    max: 10000,
    rows: 5,
    required: false,
  },
  {
    name: "material",
    label: "Material",
    max: 80,
    rows: 0,
    required: false,
  },
  {
    name: "dimensions",
    label: "Dimensões",
    max: 120,
    rows: 0,
    required: false,
  },
] as const;

const options = [
  {
    name: "active",
    label: "Ativo no catálogo",
    initial: false,
  },
  {
    name: "featured",
    label: "Produto em destaque",
    initial: false,
  },
  {
    name: "available",
    label: "Disponível",
    initial: true,
  },
  {
    name: "madeToOrder",
    label: "Aceita encomendas",
    initial: false,
  },
] as const;

interface ProductFormProps {
  product?: AdminProductResponseDTO;
  categories: CategoryResponseDTO[];
  onSave: (payload: ProductRequestDTO) => Promise<void>;
  onClose: () => void;
}

export function ProductForm({
  product,
  categories,
  onSave,
  onClose,
}: ProductFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const [priceVisible, setPriceVisible] = useState(
    product?.priceVisible ?? false,
  );

  const selectedIds = new Set(
    product?.categories.map((category) => category.id),
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) return;

    const form = new FormData(event.currentTarget);

    const text = (name: string) =>
      String(form.get(name) ?? "").trim();

    const priceText = text("price").replace(",", ".");

    const payload: ProductRequestDTO = {
      name: text("name"),
      slug: product?.slug ?? generateSlug(text("name"), "produto"),
      shortDescription: text("shortDescription") || null,
      description: text("description") || null,
      material: text("material") || null,
      dimensions: text("dimensions") || null,
      price: priceText === "" ? null : Number(priceText),
      priceVisible,
      active: form.get("active") === "on",
      featured: form.get("featured") === "on",
      available: form.get("available") === "on",
      madeToOrder: form.get("madeToOrder") === "on",
      categoryIds: form.getAll("categoryIds").map(Number),
    };

    setPending(true);
    setError("");

    try {
      await onSave(payload);
    } catch (cause) {
      setError(getProductErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminDialog
      title={product ? "Editar produto" : "Novo produto"}
      busy={pending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={pending}
          className="space-y-6"
        >
          <legend className="sr-only">
            Dados do produto
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            {textFields.map((field) => (
              <div
                key={field.name}
                className={field.rows ? "sm:col-span-2" : ""}
              >
                <label
                  htmlFor={`product-${field.name}`}
                  className="mb-2 block text-sm font-semibold"
                >
                  {field.label}
                  {field.required ? " *" : ""}
                </label>

                {field.rows ? (
                  <textarea
                    id={`product-${field.name}`}
                    name={field.name}
                    className="admin-input resize-y"
                    defaultValue={product?.[field.name] ?? ""}
                    maxLength={field.max}
                    rows={field.rows}
                  />
                ) : (
                  <input
                    id={`product-${field.name}`}
                    name={field.name}
                    className="admin-input"
                    defaultValue={product?.[field.name] ?? ""}
                    maxLength={field.max}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-brand-100 p-4">
            <label
              htmlFor="product-price"
              className="mb-2 block text-sm font-semibold"
            >
              Preço (R$)
              {priceVisible ? " *" : ""}
            </label>

            <input
              id="product-price"
              name="price"
              type="text"
              inputMode="decimal"
              className="admin-input"
              defaultValue={
                product?.price?.toFixed(2).replace(".", ",") ?? ""
              }
              required={priceVisible}
              pattern={"[0-9]{1,8}([.,][0-9]{1,2})?"}
              title="Informe um valor sem separador de milhar, como 89,90."
              aria-describedby="product-price-help"
              placeholder="Ex.: 89,90"
            />

            <label className="mt-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={priceVisible}
                onChange={(event) =>
                  setPriceVisible(event.target.checked)
                }
                className="size-4 accent-brand-800"
              />
              Exibir preço no catálogo
            </label>

            <p
              id="product-price-help"
              className="mt-2 text-xs leading-5 text-brand-600"
            >
              Você pode manter um preço cadastrado sem
              exibi-lo ao público. Deixe o campo vazio se
              ainda não houver preço definido.
            </p>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              Exibição e disponibilidade
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((option) => (
                <label
                  key={option.name}
                  className="flex items-center gap-3 text-sm"
                >
                  <input
                    name={option.name}
                    type="checkbox"
                    defaultChecked={
                      product?.[option.name] ?? option.initial
                    }
                    className="size-4 accent-brand-800"
                  />

                  {option.label}
                </label>
              ))}
            </div>

            {!product && (
              <p className="mt-3 text-xs leading-5 text-brand-600">
                Novos produtos começam inativos. Ative quando
                estiverem prontos para aparecer no catálogo.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              Categorias
            </legend>

            <p className="mb-3 text-xs leading-5 text-brand-600">
              Selecione uma ou mais categorias, ou deixe sem
              categoria por enquanto.
            </p>

            {categories.length === 0 ? (
              <p className="text-sm text-brand-700">
                Nenhuma categoria cadastrada.
              </p>
            ) : (
              <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-brand-200 p-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-start gap-3 rounded-lg p-2 text-sm hover:bg-brand-100"
                  >
                    <input
                      name="categoryIds"
                      type="checkbox"
                      value={category.id}
                      defaultChecked={selectedIds.has(category.id)}
                      className="mt-1 size-4 shrink-0 accent-brand-800"
                    />

                    <span className="min-w-0 break-words">
                      {category.name}

                      {!category.active && (
                        <span className="block text-xs text-brand-600">
                          Inativa no catálogo
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="admin-secondary"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="admin-primary"
            >
              {pending ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </fieldset>
      </form>
    </AdminDialog>
  );
}