import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AdminDialog } from "../../components/admin/AdminDialog";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import {
  deleteProduct,
  getAdminProducts,
  getProductErrorMessage,
} from "../../services/adminProductService";
import type { AdminProductResponseDTO } from "../../types/adminProduct";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<AdminProductResponseDTO | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const productData = await getAdminProducts(controller.signal);

        if (!controller.signal.aborted) {
          setProducts(productData);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLoadError(getProductErrorMessage(cause));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [attempt]);

  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteProduct(deleteTarget.id);

      setProducts((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
      setNotice("Produto excluído com sucesso.");
    } catch (cause) {
      setDeleteError(getProductErrorMessage(cause));
    } finally {
      setDeleting(false);
    }
  }

  const sortedProducts = [...products].sort(
    (a, b) =>
      a.name.localeCompare(b.name, "pt-BR") ||
      a.id - b.id,
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Peças do atelier
          </p>

          <h1 className="mt-3 font-display text-4xl sm:text-5xl">
            Produtos
          </h1>

          <p className="mt-3 text-sm leading-6 text-brand-700">
            Organize informações, preços, disponibilidade e categorias.
          </p>
        </div>

        <Link
          className="admin-primary"
          to="/admin/produtos/novo"
        >
          + Novo produto
        </Link>
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
            Total: {products.length}
            {" · "}
            Ativos: {products.filter((item) => item.active).length}
          </p>

          {products.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-brand-300 p-10 text-center text-brand-700">
              Nenhum produto cadastrado. Clique em “Novo produto”
              para começar.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <article
                  key={product.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-brand-200 bg-white/60 p-5"
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 font-semibold ${
                        product.active
                          ? "bg-green-100 text-green-900"
                          : "bg-brand-200 text-brand-800"
                      }`}
                    >
                      {product.active ? "Ativo" : "Inativo"}
                    </span>

                    {product.featured && (
                      <span className="rounded-full bg-brand-100 px-3 py-1">
                        Destaque
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 break-words font-display text-3xl">
                    {product.name}
                  </h2>

                  <p className="mt-4 font-semibold">
                    {product.price === null
                      ? "Sem preço definido"
                      : currency.format(product.price)}
                  </p>

                  <p className="mt-1 text-xs text-brand-600">
                    {product.priceVisible
                      ? "Preço visível no catálogo"
                      : "Preço oculto no catálogo"}
                  </p>

                  <p className="mt-4 text-sm text-brand-700">
                    {product.available
                      ? "Disponível"
                      : "Indisponível"}

                    {product.madeToOrder
                      ? " · Aceita encomendas"
                      : ""}
                  </p>

                  <p className="mt-2 break-words text-xs leading-5 text-brand-600">
                    {product.categories.length
                      ? product.categories
                          .map(
                            (category) =>
                              `${category.name}${
                                category.active ? "" : " (inativa)"
                              }`,
                          )
                          .join(", ")
                      : "Sem categoria"}
                  </p>

                  <p className="mt-2 text-xs text-brand-600">
                    Imagens cadastradas: {product.images.length}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    <Link
                      className="admin-secondary"
                      aria-label={`Editar produto ${product.name}`}
                      to={`/admin/produtos/${product.id}`}
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50"
                      aria-label={`Excluir produto ${product.name}`}
                      onClick={() => {
                        setNotice("");
                        setDeleteError("");
                        setDeleteTarget(product);
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

      {deleteTarget && (
        <AdminDialog
          title="Excluir produto?"
          busy={deleting}
          onClose={() => setDeleteTarget(null)}
        >
          <p className="break-words text-sm leading-7">
            O produto <strong>{deleteTarget.name}</strong> e suas
            imagens serão excluídos. Essa ação não pode ser desfeita.
          </p>

          <p className="mt-3 text-sm text-brand-700">
            Para apenas retirá-lo do catálogo, edite e desmarque
            “Ativo no catálogo”.
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
              type="button"
              className="admin-secondary"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </button>

            <button
              type="button"
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