import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";

import type { ProductImageResponseDTO } from "../../types/productImage";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

interface ProductGalleryProps {
  images: ProductImageResponseDTO[];
  productName: string;
}

interface GalleryImage {
  image: ProductImageResponseDTO;
  url: string | null;
  position: number;
}

function sortProductImages(
  images: ProductImageResponseDTO[],
): ProductImageResponseDTO[] {
  return [...images].sort((firstImage, secondImage) => {
    if (firstImage.mainImage !== secondImage.mainImage) {
      return firstImage.mainImage ? -1 : 1;
    }

    const firstOrder = firstImage.displayOrder ?? Number.MAX_SAFE_INTEGER;

    const secondOrder = secondImage.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return firstImage.id - secondImage.id;
  });
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(
    () => new Set(),
  );

  const galleryImages: GalleryImage[] = sortProductImages(images).map(
    (image, index) => ({
      image,
      url: resolveImageUrl(image.url),
      position: index + 1,
    }),
  );

  const availableImages = galleryImages.filter(
    ({ image, url }) => url !== null && !failedImageIds.has(image.id),
  );

  const selectedImage =
    availableImages.find(({ image }) => image.id === selectedImageId) ??
    availableImages[0] ??
    null;

  const selectedImageIndex = selectedImage
    ? availableImages.findIndex(
        ({ image }) => image.id === selectedImage.image.id,
      )
    : -1;

  function handleImageError(imageId: number) {
    setFailedImageIds((currentFailedImageIds) => {
      if (currentFailedImageIds.has(imageId)) {
        return currentFailedImageIds;
      }

      const updatedFailedImageIds = new Set(currentFailedImageIds);

      updatedFailedImageIds.add(imageId);

      return updatedFailedImageIds;
    });
  }

  function selectRelativeImage(direction: number) {
    if (availableImages.length <= 1 || selectedImageIndex < 0) {
      return;
    }

    const nextImageIndex =
      (selectedImageIndex + direction + availableImages.length) %
      availableImages.length;

    setSelectedImageId(availableImages[nextImageIndex].image.id);
  }

  const selectedImageAlt = selectedImage
    ? selectedImage.image.altText?.trim() ||
      `${productName}, imagem ${selectedImage.position}`
    : "";

  return (
    <div
      role="region"
      aria-label={`Galeria de imagens de ${productName}`}
      className="mx-auto w-full max-w-lg min-w-0"
    >
      <div className="relative overflow-hidden rounded-3xl border border-brand-200 bg-brand-100 shadow-sm">
        <div className="aspect-square">
          {selectedImage ? (
            <img
              key={selectedImage.image.id}
              src={selectedImage.url ?? undefined}
              alt={selectedImageAlt}
              decoding="async"
              onError={() => handleImageError(selectedImage.image.id)}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-8 text-center text-brand-600">
              <ImageOff className="size-12" aria-hidden="true" />

              <div>
                <p className="font-semibold text-brand-800">
                  Imagem indisponível
                </p>

                <p className="mt-1 text-sm text-brand-600">
                  Não foi possível carregar as imagens desta peça.
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedImage && availableImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => selectRelativeImage(-1)}
              aria-label="Visualizar imagem anterior"
              className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-50/90 text-brand-900 shadow-md backdrop-blur transition hover:bg-brand-50 sm:left-4"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => selectRelativeImage(1)}
              aria-label="Visualizar próxima imagem"
              className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-50/90 text-brand-900 shadow-md backdrop-blur transition hover:bg-brand-50 sm:right-4"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}

        {selectedImage && availableImages.length > 1 && (
          <p
            className="absolute bottom-3 right-3 rounded-full bg-brand-950/75 px-3 py-1.5 text-xs font-semibold text-brand-50 backdrop-blur sm:bottom-4 sm:right-4"
            aria-live="polite"
          >
            {selectedImageIndex + 1} de {availableImages.length}
          </p>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-2">
          <ul
            className="flex gap-3"
            aria-label="Miniaturas das imagens do produto"
          >
            {galleryImages.map(({ image, url, position }) => {
              const hasFailed = url === null || failedImageIds.has(image.id);

              const isSelected = selectedImage?.image.id === image.id;

              return (
                <li key={image.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedImageId(image.id)}
                    disabled={hasFailed}
                    aria-pressed={isSelected}
                    aria-label={`Visualizar imagem ${position} de ${galleryImages.length} de ${productName}`}
                    className={[
                      "relative size-20 overflow-hidden rounded-xl border-2 bg-brand-100 transition sm:size-24",
                      isSelected
                        ? "border-brand-900 ring-2 ring-brand-300 ring-offset-2"
                        : "border-transparent hover:border-brand-400",
                      hasFailed ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                  >
                    {!hasFailed ? (
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={() => handleImageError(image.id)}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-brand-500">
                        <ImageOff className="size-6" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
