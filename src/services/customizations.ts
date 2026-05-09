import { apiRequest } from "./api";

export interface CustomizationOptionDto {
  id: number;
  category_id: number;
  name: string;
  image_path: string | null;
  price_modifier: number | string;
  sort_order: number;
}

export interface CustomizationCategoryDto {
  id: number;
  garment_type: string;
  name: string;
  sort_order: number;
  options: CustomizationOptionDto[];
}

export async function listCustomizations(): Promise<Record<string, CustomizationCategoryDto[]>> {
  const res = await apiRequest<{ data: Record<string, CustomizationCategoryDto[]> }>("/api/customizations");
  return res.data;
}

export async function createCustomizationCategory(data: any): Promise<CustomizationCategoryDto> {
  const res = await apiRequest<{ data: CustomizationCategoryDto }>("/api/customizations", {
    method: "POST",
    body: data,
  });
  return res.data;
}
