import { apiRequest } from "@/services/api";
import type { AppointmentDto } from "@/services/appointments";

export type DashboardResponse = {
  role: string;
  stats: {
    total_customers: number;
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    pending_payments: number;
    revenue_today?: number;
    revenue_this_month?: number;
    pending_revenue?: number;
    today_appointments_count?: number;
    upcoming_appointments_count?: number;
    measurements_total?: number;
    measurements_recent_7d?: number;
    billing_pending_total?: number;
    billing_overdue_count?: number;
    new_customers_this_month?: number;
  };
  recent_orders: Array<{
    id: number;
    order_number: string;
    status: string;
    customer?: { name: string };
  }>;
  todays_appointments: AppointmentDto[];
  order_status: Record<string, number>;
  monthly_revenue?: Array<{ month: string; revenue: number }>;
};

export async function getDashboard() {
  return apiRequest<DashboardResponse>("/api/dashboard");
}

