import { useEffect, useState } from "react";

import { AdminDialog } from "../../components/admin/AdminDialog";
import { CategoryForm } from "../../components/admin/CategoryForm";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategoryErrorMessage,
  updateCategory,
} from "../../services/adminCategoryService";

import type {
  CategoryRequestDTO,
  CategoryResponseDTO,
} from "../../types/category";

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<
    CategoryResponseDTO[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");

  const [editor, setEditor] = useState<{
    category?: CategoryResponseDTO;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<CategoryResponseDTO | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const data = await getAdminCategories(
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setCategories(data);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLoadError(getCategoryErrorMessage(cause));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, [attempt]);

  async function handleSave(payload: CategoryRequestDTO) {
    const category = editor?.category;

    const saved = category
      ? await updateCategory(category.id, payload)
      : await createCategory(payload);

    setCategories((current) => [
      ...current.filter((item) => item.id !== saved.id),
      saved,
    ]);

    setEditor(null);

    setNotice(
      category
        ? "Categoria atualizada com sucesso."
        : "Categoria criada com sucesso.",
    );
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteCategory(deleteTarget.id);

      setCategories((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
      setNotice("Categoria excluída com sucesso.");
    } catch (cause) {
      setDeleteError(getCategoryErrorMessage(cause));
    } finally {
      setDeleting(false);
    }
  }

  const sortedCategories = [...categories].sort(
    (a, b) =>
      (a.displayOrder ?? 2147483647) -
        (b.displayOrder ?? 2147483647) ||
      a.name.localeCompare(b.name, "pt-BR") ||
      a.id - b.id,
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Organização do catálogo
          </p>

          <h1 className="mt-3 font-display text-4xl sm:text-5xl">
            Categorias
          </h1>

          <p className="mt-3 text-sm leading-6 text-brand-700">
            Crie, organize e escolha quais categorias
            ficam disponíveis no site.
          </p>
        </div>

        <button
          className="admin-primary"
          disabled={loading || Boolean(loadError)}
          onClick={() => {
            setNotice("");
            setEditor({});
          }}
        >
          + Nova categoria
        </button>
      </div>

      <p
        role="status"
        className={
          notice
            ? "mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
            : "sr-only"
        }
      >
        {notice}
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : loadError ? (
        <div className="mt-8">
          <ErrorMessage
            message={loadError}
            onRetry={() => {
              setLoading(true);
              setLoadError("");
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-brand-600">
            Total: {categories.length} · Ativas:{" "}
            {categories.filter((item) => item.active).length}
          </p>

          {categories.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-brand-300 p-10 text-center">
              <h2 className="font-display text-3xl">
                Seu catálogo começa aqui
              </h2>

              <p className="mt-3 text-sm text-brand-700">
                Clique em “Nova categoria” para cadastrar a primeira.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedCategories.map((category) => (
                <article
                  key={category.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-brand-200 bg-white/60 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 font-semibold ${
                        category.active
                          ? "bg-green-100 text-green-900"
                          : "bg-brand-200 text-brand-800"
                      }`}
                    >
                      {category.active ? "Ativa" : "Inativa"}
                    </span>

                    <span className="text-brand-600">
                      Ordem: {category.displayOrder ?? "—"}
                    </span>
                  </div>

                  <h2 className="mt-4 break-words font-display text-3xl">
                    {category.name}
                  </h2>

                  <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-brand-700">
                    {category.description || "Sem descrição."}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    <button
                      className="admin-secondary"
                      aria-label={`Editar categoria ${category.name}`}
                      onClick={() => {
                        setNotice("");
                        setEditor({ category });
                      }}
                    >
                      Editar
                    </button>

                    <button
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50"
                      aria-label={`Excluir categoria ${category.name}`}
                      onClick={() => {
                        setNotice("");
                        setDeleteError("");
                        setDeleteTarget(category);
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {editor && (
        <CategoryForm
          key={editor.category?.id ?? "new"}
          category={editor.category}
          onSave={handleSave}
          onClose={() => setEditor(null)}
        />
      )}

      {deleteTarget && (
        <AdminDialog
          title="Excluir categoria?"
          busy={deleting}
          onClose={() => setDeleteTarget(null)}
        >
          <p className="break-words text-sm leading-7">
            Você está prestes a excluir{" "}
            <strong>{deleteTarget.name}</strong>.
            Essa ação não pode ser desfeita.
          </p>

          <p className="mt-3 text-sm leading-6 text-brand-700">
            Categorias com produtos vinculados devem ser
            desativadas em vez de excluídas.
          </p>

          {deleteError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
            >
              {deleteError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              className="admin-secondary"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </button>

            <button
              className="rounded-xl bg-red-800 px-5 py-3 text-sm font-semibold text-white hover:bg-red-900 disabled:cursor-wait disabled:opacity-60"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Excluindo..." : "Confirmar exclusão"}
            </button>
          </div>
        </AdminDialog>
      )}
    </>
  );
}