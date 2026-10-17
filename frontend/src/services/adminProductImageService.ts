import axios from "axios";
import { api } from "./api";
import type { ProductImageResponseDTO } from "../types/productImage";

export interface ProductImageRequestDTO {
  url: string;
  altText: string | null;
  mainImage: boolean;
  displayOrder: number;
}

const endpoint = (productId: number) =>
  `/admin/products/${productId}/images`;

export async function getProductImages(productId: number) {
  const { data } = await api.get<ProductImageResponseDTO[]>(
    endpoint(productId),
  );

  return data;
}

export async function uploadProductImage(
  productId: number,
  file: File,
  altText: string,
) {
  const form = new FormData();

  form.append("file", file);
  form.append("altText", altText);

  const { data } = await api.post<ProductImageResponseDTO>(
    `${endpoint(productId)}/upload`,
    form,
    { timeout: 60_000 },
  );

  return data;
}

export async function updateProductImage(
  productId: number,
  imageId: number,
  payload: ProductImageRequestDTO,
) {
  const { data } = await api.put<ProductImageResponseDTO>(
    `${endpoint(productId)}/${imageId}`,
    payload,
  );

  return data;
}

export async function deleteProductImage(
  productId: number,
  imageId: number,
) {
  await api.delete(`${endpoint(productId)}/${imageId}`);
}

export async function reorderProductImages(
  productId: number,
  imageIds: number[],
) {
  const { data } = await api.put<ProductImageResponseDTO[]>(
    `${endpoint(productId)}/order`,
    { imageIds },
  );

  return data;
}

export function getImageErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ detail?: string }>(error)) {
    return error instanceof Error
      ? error.message
      : "Não foi possível concluir a operação.";
  }

  if (!error.response) {
    return "Não foi possível confirmar a operação. Atualize as fotos e confira o resultado antes de tentar novamente.";
  }

  const { status, data } = error.response;

  if (status === 401) {
    return "Sua sessão terminou. Entre novamente.";
  }

  if (status === 403) {
    return "A operação foi recusada. Atualize a página e confira seu acesso.";
  }

  if (status === 413) {
    return "A foto enviada ultrapassa o tamanho permitido.";
  }

  if (status === 404) {
    return "O produto ou a foto não foi encontrado. Atualize a página.";
  }

  const messages: Record<string, string> = {
    "Only JPEG and PNG images are supported.":
      "Escolha uma foto no formato JPG ou PNG.",

    "Invalid image file.":
      "Não foi possível ler essa foto. Escolha outro arquivo.",

    "An image file is required.":
      "Selecione uma foto para enviar.",

    "Image file must not exceed 5 MiB.":
      "A foto enviada ultrapassa o tamanho permitido.",

    "Image must not exceed 20 megapixels.":
      "A resolução da foto ultrapassa o limite permitido.",

    "A product may have at most 20 images.":
      "Cada produto pode ter até 20 fotos.",

    "Alternative text must contain at most 200 characters.":
      "A descrição da foto pode ter até 200 caracteres.",

    "Image order must contain every image of this product exactly once.":
      "As fotos foram alteradas. Atualize a galeria antes de reorganizar.",
  };

  return (
    messages[data?.detail ?? ""] ??
    "Não foi possível salvar a alteração. Tente novamente mais tarde."
  );
}