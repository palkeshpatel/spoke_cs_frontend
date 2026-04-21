import { apiRequest } from "@/services/api";

export type CustomerLite = {
  id: number;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type AppointmentDto = {
  id: number;
  customer_id: number;
  service_type: string;
  appointment_date: string;
  appointment_time: string | null;
  duration_minutes: number;
  priority: "low" | "normal" | "high";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: CustomerLite;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
};

export type AppointmentServiceDto = {
  id: number;
  service_name: string;
  duration_minutes: number;
  price: string;
};

export async function listAppointments(perPage = 100, customerId?: number) {
  const q = new URLSearchParams({ per_page: String(perPage) });
  if (customerId !== undefined && Number.isFinite(customerId)) {
    q.set("customer_id", String(customerId));
  }
  return apiRequest<Paginated<AppointmentDto>>(`/api/appointments?${q.toString()}`);
}

export async function getAppointment(id: string | number) {
  return apiRequest<AppointmentDto>(`/api/appointments/${id}`);
}

export async function createAppointment(payload: {
  customer_id: number;
  service_type: string;
  appointment_date: string;
  appointment_time?: string | null;
  duration_minutes?: number;
  priority?: "low" | "normal" | "high";
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string | null;
}) {
  return apiRequest<AppointmentDto>("/api/appointments", { method: "POST", body: payload });
}

export async function updateAppointment(
  id: string | number,
  payload: Partial<{
    customer_id: number;
    service_type: string;
    appointment_date: string;
    appointment_time: string | null;
    duration_minutes: number;
    priority: "low" | "normal" | "high";
    status: "pending" | "confirmed" | "completed" | "cancelled";
    notes: string | null;
  }>,
) {
  return apiRequest<AppointmentDto>(`/api/appointments/${id}`, { method: "PUT", body: payload });
}

export async function sendAppointmentReminder(id: string | number) {
  return apiRequest<{ message: string }>(`/api/appointments/${id}/remind`, { method: "POST", body: {} });
}

export async function listAppointmentServices() {
  return apiRequest<AppointmentServiceDto[]>("/api/appointment-services");
}

export async function listCustomers(perPage = 200) {
  return apiRequest<Paginated<CustomerLite>>(`/api/customers?per_page=${perPage}`);
}

