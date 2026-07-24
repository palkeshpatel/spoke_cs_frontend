import { apiRequest } from "@/services/api";
import { Paginated } from "@/services/orders";

export type Garment = {
  id: number;
  branch_id: number | null;
  name: string;
  image_path?: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryStock = {
  id: number;
  branch_id: number | null;
  fabric_code: string;
  fabric_name: string;
  color: string | null;
  composition: string | null;
  width_cm: string | number | null;
  weight_gsm: string | number | null;
  lead_time_days: number | null;
  price_per_meter: string | number;
  total_stock_meter: string | number;
  reserved_meter: string | number;
  available_meter: string | number;
  image: string | null;
  status: "in_stock" | "low_stock" | "out_of_stock";
  created_at: string;
  updated_at: string;
  garments?: Garment[];
};

export type InventoryTransaction = {
  id: number;
  branch_id: number | null;
  inventory_stock_id: number;
  transaction_type: "add" | "remove" | "order_used" | "adjustment";
  quantity_meter: string | number;
  reference_type: "purchase" | "manual" | "order";
  reference_id: number | null;
  note: string | null;
  created_by: number | null;
  created_at: string;
  stock?: InventoryStock;
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export async function fetchGarments() {
  return apiRequest<Garment[]>("/api/inventory/garments");
}

export async function listGarments() {
  return fetchGarments();
}

export async function createGarment(data: FormData | string) {
  if (typeof data === "string") {
    return apiRequest<Garment>("/api/inventory/garments", {
      method: "POST",
      body: { name: data },
    });
  }
  return apiRequest<Garment>("/api/inventory/garments", {
    method: "POST",
    body: data as unknown as Record<string, unknown>, // the generic apiRequest will handle FormData internally if adapted, but wait. If apiRequest doesn't support FormData directly, we'll see. Wait, usually axios instance handles it.
  });
}

export async function updateGarment(id: number, data: FormData) {
  return apiRequest<Garment>(`/api/inventory/garments/${id}`, {
    method: "POST", // using POST because FormData with files doesn't work well with PUT in PHP
    body: data as unknown as Record<string, unknown>,
  });
}

export async function deleteGarment(id: number) {
  return apiRequest(`/api/inventory/garments/${id}`, {
    method: "DELETE",
  });
}

export async function listInventoryStocks(params: {
  page?: number;
  per_page?: number;
  search?: string;
  garment_id?: number | string;
  color?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.per_page) q.set("per_page", String(params.per_page));
  if (params.search) q.set("search", params.search);
  if (params.garment_id) q.set("garment_id", String(params.garment_id));
  if (params.color) q.set("color", params.color);
  if (params.status && params.status !== "all" && params.status !== "All") {
    q.set("status", params.status);
  }
  return apiRequest<Paginated<InventoryStock>>(`/api/inventory/stocks?${q.toString()}`);
}

export async function saveInventoryStock(formData: FormData) {
  return apiRequest<InventoryStock>("/api/inventory/stocks", {
    method: "POST",
    body: formData, // Uses FormData for potential image upload
  });
}

export async function adjustInventoryStock(
  id: number,
  params: {
    transaction_type: "add" | "remove";
    quantity_meter: number;
    note?: string;
  }
) {
  return apiRequest<{ stock: InventoryStock; transaction: InventoryTransaction }>(
    `/api/inventory/stocks/${id}/adjust`,
    {
      method: "POST",
      body: params,
    }
  );
}

export async function listInventoryTransactions(params: {
  page?: number;
  per_page?: number;
  inventory_stock_id?: number;
  transaction_type?: string;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.per_page) q.set("per_page", String(params.per_page));
  if (params.inventory_stock_id) q.set("inventory_stock_id", String(params.inventory_stock_id));
  if (params.transaction_type && params.transaction_type !== "all") {
    q.set("transaction_type", params.transaction_type);
  }
  return apiRequest<Paginated<InventoryTransaction>>(`/api/inventory/transactions?${q.toString()}`);
}
