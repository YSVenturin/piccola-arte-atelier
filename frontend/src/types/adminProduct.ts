import type { ProductDetailsDTO } from "./product";

export type AdminProductResponseDTO = ProductDetailsDTO;

export interface ProductRequestDTO {
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  priceVisible: boolean;
  featured: boolean;
  material: string | null;
  dimensions: string | null;
  active: boolean;
  available: boolean;
  madeToOrder: boolean;
  categoryIds: number[];
}