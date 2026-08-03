import { apiRequest } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomizationOptionDto {
  id: number;
  category_id: number;
  name: string;
  image_path: string | null;
  price_modifier: number;
  sort_order: number;
  requires_note?: boolean;
}

export interface CustomizationCategoryDto {
  id: number;
  garment_id: number | null;
  garment_type: string | null;
  name: string;
  sort_order: number;
  options: CustomizationOptionDto[];
}

// Keyed by garment name (e.g. "Shirts", "Suits")
export type CustomizationsGrouped = Record<string, CustomizationCategoryDto[]>;

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function listCustomizations(): Promise<CustomizationsGrouped> {
  const res = await apiRequest<{ data: CustomizationsGrouped }>("/api/customizations");
  return res.data;
}

// ─── Category CRUD ───────────────────────────────────────────────────────────

export async function createCategory(data: {
  name: string;
  garment_id: number | null;
  sort_order?: number;
}): Promise<CustomizationCategoryDto> {
  const res = await apiRequest<{ data: CustomizationCategoryDto }>("/api/customizations/categories", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateCategory(
  id: number,
  data: Partial<{ name: string; garment_id: number | null; sort_order: number }>
): Promise<CustomizationCategoryDto> {
  const res = await apiRequest<{ data: CustomizationCategoryDto }>(
    `/api/customizations/categories/${id}`,
    { method: "PUT", body: data }
  );
  return res.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiRequest(`/api/customizations/categories/${id}`, { method: "DELETE" });
}

// ─── Option CRUD ─────────────────────────────────────────────────────────────

export async function createOption(data: {
  category_id: number;
  name: string;
  price_modifier: number;
  sort_order?: number;
  requires_note?: boolean;
}): Promise<CustomizationOptionDto> {
  const res = await apiRequest<{ data: CustomizationOptionDto }>("/api/customizations/options", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateOption(
  id: number,
  data: Partial<{ name: string; price_modifier: number; sort_order: number; requires_note: boolean }>
): Promise<CustomizationOptionDto> {
  const res = await apiRequest<{ data: CustomizationOptionDto }>(
    `/api/customizations/options/${id}`,
    { method: "PUT", body: data }
  );
  return res.data;
}

export async function deleteOption(id: number): Promise<void> {
  await apiRequest(`/api/customizations/options/${id}`, { method: "DELETE" });
}
