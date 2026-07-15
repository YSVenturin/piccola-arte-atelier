import type {
    ProductDetailsDTO,
    ProductSummaryDTO,
} from "../types/product";
import { api } from "./api";

export async function getProducts(): Promise<ProductSummaryDTO[]> {
    const response = await api.get<ProductSummaryDTO[]>("/products");

    return response.data;
}

export async function getProductBySlug(slug: string): Promise<ProductDetailsDTO> {
    const response = await api.get<ProductDetailsDTO>(`/products/${encodeURIComponent(slug)}`);

    return response.data;
}
