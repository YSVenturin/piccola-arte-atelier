import type { CategoryResponseDTO } from "../types/category";
import { api } from "./api";

export async function getCategories(): Promise<CategoryResponseDTO[]> {
    const response = await api.get<CategoryResponseDTO[]>("/categories");

    return response.data;
}