import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { ProductImageResponseDTO } from "../../types/productImage";
import {
  deleteProductImage,
  getImageErrorMessage,
  getProductImages,
  reorderProductImages,
  updateProductImage,
  uploadProductImage,
} from "../../services/adminProductImageService";
import { prepareProductPhoto } from "../../utils/prepareProductPhoto";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { AdminDialog } from "./AdminDialog";

interface PendingPhoto {
  id: number;
  file: File;
  preview: string;
}

interface ProductPhotosEditorProps {
  productId: number;
  productName: string;
  images: ProductImageResponseDTO[];
  onChange: (images: ProductImageResponseDTO[]) => void;
}

export function ProductPhotosEditor({
  productId,
  productName,
  images,
  onChange,
}: ProductPhotosEditorProps) {
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<ProductImageResponseDTO | null>(null);

  const urls = useRef(new Map<number, string>());
  const sequence = useRef(0);
  const mounted = useRef(true);

  const sorted = [...images].sort(
    (a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      a.id - b.id,
  );

  useEffect(() => {
    const previews = urls.current;
    mounted.current = true;

    return () => {
      mounted.current = false;
      previews.forEach((url) => URL.revokeObjectURL(url));
      previews.clear();
    };
  }, []);

  function removePending(id: number) {
    const url = urls.current.get(id);

    if (url) URL.revokeObjectURL(url);

    urls.current.delete(id);

    setPending((current) =>
      current.filter((photo) => photo.id !== id),
    );
  }

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (!files.length || busy) return;

    setError("");
    setNotice("");

    if (images.length + pending.length + files.length > 20) {
      setError("Cada produto pode ter até 20 fotos.");
      return;
    }

    setBusy(true);

    try {
      for (const file of files) {
        const prepared = await prepareProductPhoto(file);

        if (!mounted.current) return;

        const id = ++sequence.current;
        const preview = URL.createObjectURL(prepared);

        urls.current.set(id, preview);

        setPending((current) => [
          ...current,
          { id, file: prepared, preview },
        ]);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível preparar a foto.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      onChange(await getProductImages(productId));
    } catch (cause) {
      setError(getImageErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function upload() {
    if (busy || !pending.length) return;

    setBusy(true);
    setError("");
    setNotice("");

    let current = images;
    let count = 0;

    try {
      for (const photo of pending) {
        const created = await uploadProductImage(
          productId,
          photo.file,
          productName,
        );

        if (!mounted.current) return;

        current = [
          ...current.map((image) =>
            created.mainImage
              ? { ...image, mainImage: false }
              : image,
          ),
          created,
        ];

        onChange(current);
        removePending(photo.id);
        count++;
      }

      setNotice(`${count} foto(s) enviada(s) com sucesso.`);
    } catch (cause) {
      setError(
        `${count ? `${count} foto(s) já foram salvas. ` : ""}` +
          getImageErrorMessage(cause),
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveImage(
    image: ProductImageResponseDTO,
    mainImage: boolean,
    altText: string | null,
  ) {
    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const updated = await updateProductImage(
        productId,
        image.id,
        {
          url: image.url,
          altText,
          mainImage,
          displayOrder: image.displayOrder ?? 0,
        },
      );

      onChange(
        images.map((item) =>
          item.id === updated.id
            ? updated
            : updated.mainImage
              ? { ...item, mainImage: false }
              : item,
        ),
      );

      setNotice("Foto atualizada com sucesso.");
    } catch (cause) {
      setError(getImageErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: number) {
    if (busy) return;

    const reordered = [...sorted];
    const target = index + direction;

    if (target < 0 || target >= reordered.length) return;

    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];

    setBusy(true);
    setError("");
    setNotice("");

    try {
      onChange(
        await reorderProductImages(
          productId,
          reordered.map((image) => image.id),
        ),
      );

      setNotice("Ordem das fotos atualizada.");
    } catch (cause) {
      setError(getImageErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleteTarget || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await deleteProductImage(productId, deleteTarget.id);

      onChange(
        images.filter((image) => image.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
      setNotice("Foto removida com sucesso.");

      try {
        onChange(await getProductImages(productId));
      } catch {
        setError(
          "A foto foi removida. Clique em Atualizar fotos para conferir a galeria.",
        );
      }
    } catch (cause) {
      setError(getImageErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function saveDescription(
    event: FormEvent<HTMLFormElement>,
    image: ProductImageResponseDTO,
  ) {
    event.preventDefault();

    const description = String(
      new FormData(event.currentTarget).get("altText") ?? "",
    ).trim();

    void saveImage(
      image,
      image.mainImage,
      description || null,
    );
  }

  return (
    <section
      aria-labelledby="product-photos-title"
      aria-busy={busy}
      className="rounded-2xl border border-brand-200 bg-white/60 p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="product-photos-title"
          className="font-display text-3xl"
        >
          Fotos do produto
        </h2>

        <button
          type="button"
          className="admin-secondary"
          disabled={busy}
          onClick={refresh}
        >
          Atualizar fotos
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-brand-700">
        Até 20 fotos. JPG ou PNG de até 15 MB cada.
        As fotos serão otimizadas antes do envio.
        Cada alteração nas fotos é salva separadamente.
      </p>

      <label className="mt-5 block text-sm font-semibold">
        Selecionar fotos
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          disabled={busy}
          onChange={selectFiles}
          className="admin-input mt-2 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-200 file:px-3 file:py-2 file:text-brand-900"
        />
      </label>

      {pending.length > 0 && (
        <div className="mt-5 rounded-xl border border-brand-200 p-4">
          <h3 className="text-sm font-semibold">
            Fotos aguardando envio
          </h3>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pending.map((photo) => (
              <div key={photo.id}>
                <img
                  src={photo.preview}
                  alt="Prévia da foto selecionada"
                  className="aspect-square w-full rounded-xl object-cover"
                />

                <button
                  type="button"
                  className="mt-2 text-sm underline"
                  disabled={busy}
                  onClick={() => removePending(photo.id)}
                >
                  Retirar da seleção
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="admin-primary mt-4"
            disabled={busy}
            onClick={upload}
          >
            {busy
              ? "Processando..."
              : `Enviar ${pending.length} foto(s)`}
          </button>
        </div>
      )}

      {busy && (
        <p
          role="status"
          className="mt-4 text-sm text-brand-700"
        >
          Processando fotos, aguarde...
        </p>
      )}

      <p
        role="status"
        className={
          notice
            ? "mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-900"
            : "sr-only"
        }
      >
        {notice}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {!images.length && (
        <p className="mt-6 text-sm text-brand-600">
          Este produto ainda não tem fotos.
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {sorted.map((image, index) => (
          <article
            key={image.id}
            className="min-w-0 rounded-xl border border-brand-200 p-4"
          >
            <img
              src={resolveImageUrl(image.url) ?? undefined}
              alt={image.altText || productName}
              loading="lazy"
              className="aspect-square w-full rounded-xl bg-brand-100 object-cover"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>Foto {index + 1}</span>

              {image.mainImage && (
                <span className="rounded-full bg-brand-900 px-3 py-1 font-semibold text-brand-50">
                  Foto principal
                </span>
              )}
            </div>

            <form
              onSubmit={(event) =>
                saveDescription(event, image)
              }
              className="mt-4"
            >
              <label
                htmlFor={`photo-description-${image.id}`}
                className="text-sm font-semibold"
              >
                Descrição da foto
              </label>

              <textarea
                key={image.altText ?? ""}
                id={`photo-description-${image.id}`}
                name="altText"
                defaultValue={image.altText ?? ""}
                maxLength={200}
                rows={2}
                disabled={busy}
                className="admin-input mt-2 resize-y"
              />

              <p className="mt-1 text-xs leading-5 text-brand-600">
                Ajuda pessoas que utilizam leitores de tela.
              </p>

              <button
                type="submit"
                disabled={busy}
                className="admin-secondary mt-3"
              >
                Salvar descrição
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="admin-secondary"
                disabled={busy || image.mainImage}
                onClick={() =>
                  saveImage(image, true, image.altText)
                }
              >
                Usar como principal
              </button>

              <button
                type="button"
                className="admin-secondary"
                disabled={busy || index === 0}
                aria-label={`Mover foto ${index + 1} para antes`}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>

              <button
                type="button"
                className="admin-secondary"
                disabled={
                  busy || index === sorted.length - 1
                }
                aria-label={`Mover foto ${index + 1} para depois`}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>

              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setDeleteTarget(image);
                }}
              >
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>

      {deleteTarget && (
        <AdminDialog
          title="Remover foto?"
          busy={busy}
          onClose={() => setDeleteTarget(null)}
        >
          <p className="text-sm leading-6">
            A foto será removida deste produto.
            Essa ação não pode ser desfeita.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="admin-secondary"
              disabled={busy}
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={busy}
              className="admin-primary"
              onClick={remove}
            >
              {busy ? "Removendo..." : "Remover foto"}
            </button>
          </div>
        </AdminDialog>
      )}
    </section>
  );
}