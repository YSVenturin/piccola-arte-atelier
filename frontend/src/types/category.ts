export interface CategoryResponseDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  displayOrder: number | null;
}