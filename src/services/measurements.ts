import { apiRequest } from "@/services/api";

export type StaffDto = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export type CustomerLite = {
  id: number;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type MeasurementFieldDto = {
  id: number;
  field_name: string;
  garment_type: string;
  unit: string;
};

export type MeasurementValueDto = {
  id: number;
  measurement_id: number;
  field_id: number;
  value: string | number | null;
  field?: MeasurementFieldDto;
};

export type MeasurementDto = {
  id: number;
  customer_id: number;
  garment_type: string;
  taken_by: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: CustomerLite;
  taker?: StaffDto | null;
  values?: MeasurementValueDto[];
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
};

type Raw = Record<string, unknown>;

const normalizeMeasurement = (raw: Raw): MeasurementDto => {
  const values = (raw.values as MeasurementValueDto[] | undefined) ?? (raw.measurement_values as MeasurementValueDto[] | undefined) ?? [];
  return {
    ...(raw as unknown as MeasurementDto),
    values,
  };
};

const normalizePaginatedMeasurements = (raw: Raw): Paginated<MeasurementDto> => {
  const data = Array.isArray(raw.data) ? (raw.data as Raw[]).map(normalizeMeasurement) : [];
  return {
    ...(raw as unknown as Paginated<MeasurementDto>),
    data,
  };
};

export async function listMeasurements(perPage = 50, customerId?: number) {
  const q = new URLSearchParams({ per_page: String(perPage) });
  if (customerId !== undefined && Number.isFinite(customerId)) {
    q.set("customer_id", String(customerId));
  }
  const res = await apiRequest<Raw>(`/api/measurements?${q.toString()}`);
  return normalizePaginatedMeasurements(res);
}

export async function getMeasurement(id: string | number) {
  const res = await apiRequest<Raw>(`/api/measurements/${id}`);
  return normalizeMeasurement(res);
}

export async function updateMeasurement(
  id: string | number,
  payload: Partial<{
    customer_id: number;
    garment_type: string;
    taken_by: number | null;
    notes: string | null;
    values: Array<{ field_id: number; value: number | null }>;
  }>,
) {
  const res = await apiRequest<Raw>(`/api/measurements/${id}`, { method: "PUT", body: payload });
  return normalizeMeasurement(res);
}

export async function createMeasurement(payload: {
  customer_id: number;
  garment_type: string;
  taken_by?: number | null;
  notes?: string | null;
  values?: Array<{ field_id: number; value: number | null }>;
}) {
  const res = await apiRequest<Raw>(`/api/measurements`, { method: "POST", body: payload });
  return normalizeMeasurement(res);
}

export async function listMeasurementFields(garmentType?: string) {
  const query = garmentType ? `?garment_type=${encodeURIComponent(garmentType)}` : "";
  return apiRequest<MeasurementFieldDto[]>(`/api/measurement-fields${query}`);
}

export async function listStaff() {
  return apiRequest<StaffDto[]>("/api/staff");
}
