import { apiRequest } from "@/services/api";

export type CustomerLite = {
  id: number;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type OrderItemDto = {
  id: number;
  order_id: number;
  garment_type: string | null;
  measurement_id: number | null;
  quantity: number;
  price: string | number;
  created_at: string;
  updated_at: string;
};

export type OrderStatusHistoryDto = {
  id: number;
  order_id: number;
  status: string;
  changed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderDto = {
  id: number;
  order_number: string;
  customer_id: number;
  order_type: string | null;
  fabric: string | null;
  trial_date: string | null;
  delivery_date: string | null;
  notes: string | null;
  status: "pending" | "in_progress" | "trial" | "completed" | "delivered";
  created_at: string;
  updated_at: string;
  customer?: CustomerLite;
  items?: OrderItemDto[];
  status_history?: OrderStatusHistoryDto[];
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
};

export async function listOrders(perPage = 100, customerId?: number) {
  const q = new URLSearchParams({ per_page: String(perPage) });
  if (customerId !== undefined && Number.isFinite(customerId)) {
    q.set("customer_id", String(customerId));
  }
  return apiRequest<Paginated<OrderDto>>(`/api/orders?${q.toString()}`);
}

export async function getOrder(id: string | number) {
  return apiRequest<OrderDto>(`/api/orders/${id}`);
}

export async function createOrder(payload: {
  customer_id: number;
  order_number?: string;
  order_type?: string | null;
  fabric?: string | null;
  trial_date?: string | null;
  delivery_date?: string | null;
  notes?: string | null;
  status?: "pending" | "in_progress" | "trial" | "completed" | "delivered";
  items?: Array<{
    garment_type?: string | null;
    measurement_id?: number | null;
    quantity?: number;
    price?: number;
  }>;
}) {
  return apiRequest<OrderDto>("/api/orders", { method: "POST", body: payload });
}

export async function updateOrder(
  id: string | number,
  payload: Partial<{
    customer_id: number;
    order_type: string | null;
    fabric: string | null;
    trial_date: string | null;
    delivery_date: string | null;
    notes: string | null;
    status: "pending" | "in_progress" | "trial" | "completed" | "delivered";
    items: Array<{
      garment_type?: string | null;
      measurement_id?: number | null;
      quantity?: number;
      price?: number;
    }>;
    status_note: string | null;
  }>,
) {
  return apiRequest<OrderDto>(`/api/orders/${id}`, { method: "PUT", body: payload });
}
