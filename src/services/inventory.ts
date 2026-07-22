import { apiRequest } from "@/services/api";
import { Paginated } from "@/services/orders";

export type Garment = {
  id: number;
  branch_id: number | null;
  name: string;
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

export async function listGarments() {
  return apiRequest<Garment[]>("/api/inventory/garments");
}

export async function createGarment(name: string) {
  return apiRequest<Garment>("/api/inventory/garments", {
    method: "POST",
    body: { name },
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
