export interface ProductImageResponseDTO {
  id: number;
  url: string;
  altText: string | null;
  mainImage: boolean;
  displayOrder: number | null;
}