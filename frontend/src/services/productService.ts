import type { ProductDetailsDTO, ProductSummaryDTO } from "../types/product";
import { api } from "./api";

export async function getProducts(
  signal?: AbortSignal,
): Promise<ProductSummaryDTO[]> {
  const response = await api.get<ProductSummaryDTO[]>("/products", {
    signal,
  });

  return response.data;
}

export async function getProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ProductDetailsDTO> {
  const response = await api.get<ProductDetailsDTO>(
    `/products/${encodeURIComponent(slug)}`,
    {
      signal,
    },
  );

  return response.data;
}
