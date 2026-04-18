import { apiRequest } from "@/services/api";

export type CustomerLite = {
  id: number;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type InvoiceItemDto = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  price: string | number;
  total: string | number;
};

export type PaymentDto = {
  id: number;
  invoice_id: number;
  amount: string | number;
  payment_method: string | null;
  paid_at: string | null;
};

export type InvoiceDto = {
  id: number;
  invoice_number: string;
  customer_id: number;
  order_id: number | null;
  invoice_date: string;
  total_amount: string | number;
  discount: string | number;
  tax: string | number;
  grand_total: string | number;
  status: "paid" | "pending" | "overdue" | string;
  created_at: string;
  updated_at: string;
  customer?: CustomerLite;
  order?: { id: number; order_number: string } | null;
  items?: InvoiceItemDto[];
  payments?: PaymentDto[];
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
};

export async function listInvoices(perPage = 100, customerId?: number) {
  const q = new URLSearchParams({ per_page: String(perPage) });
  if (customerId !== undefined && Number.isFinite(customerId)) {
    q.set("customer_id", String(customerId));
  }
  return apiRequest<Paginated<InvoiceDto>>(`/api/invoices?${q.toString()}`);
}

export async function getInvoice(id: string | number) {
  return apiRequest<InvoiceDto>(`/api/invoices/${id}`);
}

export async function createInvoice(payload: {
  customer_id: number;
  order_id?: number | null;
  invoice_date?: string | null;
  discount?: number;
  tax?: number;
  status?: string;
  items?: Array<{ description?: string; quantity?: number; price?: number }>;
}) {
  return apiRequest<InvoiceDto>("/api/invoices", { method: "POST", body: payload });
}
