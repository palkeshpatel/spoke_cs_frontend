import { apiBaseUrl, apiRequest, getAuthToken } from "@/services/api";

type CustomerApiResponse = Record<string, unknown>;

export type CustomerPreferenceDto = {
  id: number;
  customer_id: number;
  fit_preference: string | null;
  favorite_colors: string | null;
  notes: string | null;
};

export type CustomerBodyImageDto = {
  id: number;
  customer_id: number;
  image_type: string;
  image_path: string;
  notes: string | null;
};

export type CustomerDto = {
  id: number;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  profile_image: string | null;
  vip_status: boolean;
  orders_count?: number;
  created_at: string;
  updated_at: string;
  preference?: CustomerPreferenceDto | null;
  loyalty?: { points: number; total_spent: string; last_visit: string | null } | null;
  bodyImages?: CustomerBodyImageDto[];
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
};

const normalizeCustomer = (raw: CustomerApiResponse): CustomerDto => {
  const bodyImages =
    (raw.bodyImages as CustomerBodyImageDto[] | undefined) ??
    (raw.body_images as CustomerBodyImageDto[] | undefined) ??
    [];

  return {
    ...(raw as unknown as CustomerDto),
    bodyImages,
  };
};

const normalizePaginatedCustomers = (raw: CustomerApiResponse): Paginated<CustomerDto> => {
  const data = Array.isArray(raw.data) ? (raw.data as CustomerApiResponse[]).map(normalizeCustomer) : [];
  return {
    ...(raw as unknown as Paginated<CustomerDto>),
    data,
  };
};

export async function listCustomers(perPage = 50) {
  const res = await apiRequest<CustomerApiResponse>(`/api/customers?per_page=${perPage}`);
  return normalizePaginatedCustomers(res);
}

export async function getCustomer(id: string | number) {
  const res = await apiRequest<CustomerApiResponse>(`/api/customers/${id}`);
  return normalizeCustomer(res);
}

export async function createCustomer(payload: {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  vip_status?: boolean;
  preferences?: { fit_preference?: string | null; favorite_colors?: string | null; notes?: string | null };
}) {
  const res = await apiRequest<CustomerApiResponse>("/api/customers", { method: "POST", body: payload });
  return normalizeCustomer(res);
}

export async function updateCustomer(
  id: string | number,
  payload: Partial<{
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    vip_status: boolean;
    preferences: { fit_preference?: string | null; favorite_colors?: string | null; notes?: string | null };
  }>,
) {
  const res = await apiRequest<CustomerApiResponse>(`/api/customers/${id}`, { method: "PUT", body: payload });
  return normalizeCustomer(res);
}

type InitUploadResponse = { upload_id: string };

export async function initCustomerBodyImageUpload(params: {
  customerId: number;
  imageType: string;
  originalName: string;
  totalChunks: number;
}) {
  return apiRequest<InitUploadResponse>(`/api/customers/${params.customerId}/body-images/upload/init`, {
    method: "POST",
    body: {
      image_type: params.imageType,
      original_name: params.originalName,
      total_chunks: params.totalChunks,
    },
  });
}

export async function uploadCustomerBodyImageChunk(params: {
  customerId: number;
  uploadId: string;
  chunkIndex: number;
  chunk: Blob;
}) {
  const form = new FormData();
  form.append("upload_id", params.uploadId);
  form.append("chunk_index", String(params.chunkIndex));
  form.append("chunk", params.chunk, `chunk-${params.chunkIndex}.part`);

  const url = `${apiBaseUrl()}/api/customers/${params.customerId}/body-images/upload/chunk`;
  const token = getAuthToken();
  const res = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      typeof data === "object" && data !== null && "message" in data ? String((data as { message?: unknown }).message ?? "") : "";
    throw { message: message || "Chunk upload failed", status: res.status, details: data } as const;
  }
}

export async function completeCustomerBodyImageUpload(params: { customerId: number; uploadId: string }) {
  return apiRequest<CustomerBodyImageDto>(`/api/customers/${params.customerId}/body-images/upload/complete`, {
    method: "POST",
    body: { upload_id: params.uploadId },
  });
}

export async function uploadCustomerBodyImage(params: { customerId: number; imageType: string; blob: Blob; fileName: string }) {
  const chunkSize = 1024 * 1024;
  const totalChunks = Math.max(1, Math.ceil(params.blob.size / chunkSize));
  const init = await initCustomerBodyImageUpload({
    customerId: params.customerId,
    imageType: params.imageType,
    originalName: params.fileName,
    totalChunks,
  });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(params.blob.size, start + chunkSize);
    const chunk = params.blob.slice(start, end);
    await uploadCustomerBodyImageChunk({ customerId: params.customerId, uploadId: init.upload_id, chunkIndex: i, chunk });
  }

  return completeCustomerBodyImageUpload({ customerId: params.customerId, uploadId: init.upload_id });
}

export async function deleteCustomerBodyImage(params: { customerId: number; imageId: number }) {
  return apiRequest<{ message: string }>(`/api/customers/${params.customerId}/body-images/${params.imageId}`, { method: "DELETE" });
}
