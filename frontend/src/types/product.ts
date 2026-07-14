import type { CategoryResponseDTO } from "./category";
import type { ProductImageResponseDTO } from "./productImage";

export interface ProductSummaryDTO {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number | null;
  priceVisible: boolean;
  featured: boolean;
  active: boolean;
  available: boolean;
  madeToOrder: boolean;
  mainImage: ProductImageResponseDTO | null;
  categories: CategoryResponseDTO[];
}

export interface ProductDetailsDTO {
  id: number;
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
  categories: CategoryResponseDTO[];
  images: ProductImageResponseDTO[];
  createdAt: string;
  updatedAt: string | null;
}