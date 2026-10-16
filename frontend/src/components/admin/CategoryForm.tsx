import { useState } from "react";
import type { FormEvent } from "react";

import type {
  CategoryRequestDTO,
  CategoryResponseDTO,
} from "../../types/category";
import { getCategoryErrorMessage } from "../../services/adminCategoryService";
import { AdminDialog } from "./AdminDialog";
import { generateSlug } from "../../utils/slugs";

interface CategoryFormProps {
  category?: CategoryResponseDTO;
  onSave: (payload: CategoryRequestDTO) => Promise<void>;
  onClose: () => void;
}

export function CategoryForm({
  category,
  onSave,
  onClose,
}: CategoryFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) return;

    const form = new FormData(event.currentTarget);

    const name = String(form.get("name") ?? "").trim();

    const payload: CategoryRequestDTO = {
      name,
      slug: category?.slug ?? generateSlug(name, "categoria"),
      description:
        String(form.get("description") ?? "").trim() || null,
      active: form.get("active") === "on",
      displayOrder: Number(form.get("displayOrder")),
    };

    setPending(true);
    setError("");

    try {
      await onSave(payload);
    } catch (cause) {
      setError(getCategoryErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminDialog
      title={category ? "Editar categoria" : "Nova categoria"}
      busy={pending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={pending}
          className="space-y-5"
        >
          <legend className="sr-only">
            Dados da categoria
          </legend>

          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-semibold"
            >
              Nome
            </label>

            <input
              id="category-name"
              name="name"
              className="admin-input"
              defaultValue={category?.name ?? ""}
              required
              maxLength={80}
              pattern={".*\\S.*"}
              title="Informe um nome que não contenha apenas espaços."
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="mb-2 block text-sm font-semibold"
            >
              Descrição{" "}
              <span className="font-normal">(opcional)</span>
            </label>

            <textarea
              id="category-description"
              name="description"
              className="admin-input min-h-28 resize-y"
              defaultValue={category?.description ?? ""}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div>
            <label
              htmlFor="category-order"
              className="mb-2 block text-sm font-semibold"
            >
              Ordem de exibição
            </label>

            <input
              id="category-order"
              name="displayOrder"
              type="number"
              className="admin-input"
              defaultValue={category?.displayOrder ?? 0}
              required
              min={0}
              max={2147483647}
              step={1}
              aria-describedby="category-order-help"
            />

            <p
              id="category-order-help"
              className="mt-2 text-xs text-brand-600"
            >
              Números menores aparecem primeiro.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-brand-100 p-4">
            <input
              name="active"
              type="checkbox"
              defaultChecked={category?.active ?? true}
              className="mt-1 size-4 accent-brand-800"
            />

            <span>
              <span className="block text-sm font-semibold">
                Categoria ativa
              </span>

              <span className="mt-1 block text-xs leading-5 text-brand-700">
                Disponível na listagem pública de categorias.
              </span>
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
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
              {pending ? "Salvando..." : "Salvar categoria"}
            </button>
          </div>
        </fieldset>
      </form>
    </AdminDialog>
  );
}