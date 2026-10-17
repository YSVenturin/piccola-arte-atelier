import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ProductForm } from "../../components/admin/ProductForm";
import { ProductPhotosEditor } from "../../components/admin/ProductPhotosEditor";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { getAdminCategories } from "../../services/adminCategoryService";
import {
  createProduct,
  getAdminProduct,
  getProductErrorMessage,
  updateProduct,
} from "../../services/adminProductService";
import type {
  AdminProductResponseDTO,
  ProductRequestDTO,
} from "../../types/adminProduct";
import type { CategoryResponseDTO } from "../../types/category";

export function AdminProductEditPage() {
  const { productId } = useParams();

  return (
    <ProductEditContent
      key={productId}
      productId={productId ?? ""}
    />
  );
}

function ProductEditContent({
  productId,
}: {
  productId: string;
}) {
  const navigate = useNavigate();
  const isNew = productId === "novo";

  const [product, setProduct] =
    useState<AdminProductResponseDTO | undefined>();

  const [categories, setCategories] =
    useState<CategoryResponseDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const id = Number(productId);

        if (
          !isNew &&
          (!Number.isSafeInteger(id) || id <= 0)
        ) {
          throw new Error("Invalid product ID.");
        }

        const [categoryData, productData] = await Promise.all([
          getAdminCategories(controller.signal),
          isNew
            ? Promise.resolve(undefined)
            : getAdminProduct(id, controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setCategories(categoryData);
          setProduct(productData);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(getProductErrorMessage(cause));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [productId, isNew, attempt]);

  async function save(payload: ProductRequestDTO) {
    const saved = product
      ? await updateProduct(product.id, payload)
      : await createProduct(payload);

    setProduct(saved);

    if (isNew) {
      navigate(`/admin/produtos/${saved.id}`, {
        replace: true,
      });
    } else {
      setNotice("Informações do produto salvas com sucesso.");
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  return (
    <>
      <Link
        to="/admin/produtos"
        className="text-sm underline underline-offset-4"
      >
        ← Voltar aos produtos
      </Link>

      <h1 className="mt-5 font-display text-4xl sm:text-5xl">
        {isNew ? "Novo produto" : "Editar produto"}
      </h1>

      <p className="mt-3 text-sm leading-6 text-brand-700">
        Cuide das informações e das fotos desta peça em um só lugar.
      </p>

      <p
        role="status"
        className={
          notice
            ? "mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-900"
            : "sr-only"
        }
      >
        {notice}
      </p>

      <section
        className="mt-8 rounded-2xl border border-brand-200 bg-white/60 p-5 sm:p-8"
        aria-labelledby="product-information-title"
      >
        <h2
          id="product-information-title"
          className="mb-6 font-display text-3xl"
        >
          Informações do produto
        </h2>

        <ProductForm
          embedded
          product={product}
          categories={categories}
          onSave={save}
          onClose={() => navigate("/admin/produtos")}
        />
      </section>

      <div className="mt-6">
        {product ? (
          <ProductPhotosEditor
            productId={product.id}
            productName={product.name}
            images={product.images}
            onChange={(images) =>
              setProduct((current) =>
                current ? { ...current, images } : current,
              )
            }
          />
        ) : (
          <section className="rounded-2xl border border-dashed border-brand-300 p-6">
            <h2 className="font-display text-3xl">
              Fotos do produto
            </h2>

            <p className="mt-3 text-sm leading-6 text-brand-700">
              Salve as informações para começar a adicionar as fotos.
              Você continuará nesta página.
            </p>
          </section>
        )}
      </div>
    </>
  );
}