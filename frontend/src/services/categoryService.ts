import type { CategoryResponseDTO } from "../types/category";
import { api } from "./api";

export async function getCategories(
  signal?: AbortSignal,
): Promise<CategoryResponseDTO[]> {
  const response = await api.get<CategoryResponseDTO[]>("/categories", {
    signal,
  });

  return response.data;
}