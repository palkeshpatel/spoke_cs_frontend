import { apiBaseUrl, apiRequest, getAuthToken } from "@/services/api";

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
  icon_path: string | null;
  note: string | null;
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

export type OrderCustomizationDto = {
  id: number;
  order_id: number;
  option_id: number;
  price_modifier: string | number;
  note: string | null;
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
  status: "measurement" | "cutting" | "stitching" | "trial_1" | "trial_2" | "delivery" | "pending" | "completed" | "delivered";
  created_at: string;
  updated_at: string;
  customer?: CustomerLite;
  items?: OrderItemDto[];
  status_history?: OrderStatusHistoryDto[];
  customizations?: OrderCustomizationDto[];
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
};

export async function listOrders(page = 1, perPage = 10, customerId?: number, search?: string) {
  const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (customerId !== undefined && Number.isFinite(customerId)) {
    q.set("customer_id", String(customerId));
  }
  if (search) {
    q.set("search", search);
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
  status?: "measurement" | "cutting" | "stitching" | "trial_1" | "trial_2" | "delivery" | "pending" | "completed" | "delivered";
  items?: Array<{
    garment_type?: string | null;
    measurement_id?: number | null;
    icon_path?: string | null;
    note?: string | null;
    quantity?: number;
    price?: number;
  }>;
  customizations?: Array<{
    option_id: number;
    price_modifier: number;
    note: string | null;
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
    status: "measurement" | "cutting" | "stitching" | "trial_1" | "trial_2" | "delivery" | "pending" | "completed" | "delivered";
    items: Array<{
      garment_type?: string | null;
      measurement_id?: number | null;
      icon_path?: string | null;
      note?: string | null;
      quantity?: number;
      price?: number;
    }>;
    status_note: string | null;
    customizations: Array<{
      option_id: number;
      price_modifier: number;
      note: string | null;
    }>;
  }>,
) {
  return apiRequest<OrderDto>(`/api/orders/${id}`, { method: "PUT", body: payload });
}

type InitUploadResponse = { upload_id: string };

export async function initOrderItemIconUpload(params: { originalName: string; totalChunks: number }) {
  return apiRequest<InitUploadResponse>("/api/orders/item-icon/upload/init", {
    method: "POST",
    body: {
      original_name: params.originalName,
      total_chunks: params.totalChunks,
    },
  });
}

export async function uploadOrderItemIconChunk(params: { uploadId: string; chunkIndex: number; chunk: Blob }) {
  const form = new FormData();
  form.append("upload_id", params.uploadId);
  form.append("chunk_index", String(params.chunkIndex));
  form.append("chunk", params.chunk, `chunk-${params.chunkIndex}.part`);

  return apiRequest("/api/orders/item-icon/upload/chunk", {
    method: "POST",
    body: form,
  });
}

export async function completeOrderItemIconUpload(params: { uploadId: string }) {
  return apiRequest<{ icon_path: string }>("/api/orders/item-icon/upload/complete", {
    method: "POST",
    body: { upload_id: params.uploadId },
  });
}

export async function uploadOrderItemIcon(params: { blob: Blob; fileName: string }) {
  const chunkSize = 1024 * 1024;
  const totalChunks = Math.max(1, Math.ceil(params.blob.size / chunkSize));
  const init = await initOrderItemIconUpload({
    originalName: params.fileName,
    totalChunks,
  });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(params.blob.size, start + chunkSize);
    const chunk = params.blob.slice(start, end);
    await uploadOrderItemIconChunk({ uploadId: init.upload_id, chunkIndex: i, chunk });
  }

  return completeOrderItemIconUpload({ uploadId: init.upload_id });
}
