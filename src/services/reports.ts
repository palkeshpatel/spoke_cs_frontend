import { apiRequest } from "./api";

export interface ReportData {
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
  ordersPerMonth: {
    month: string;
    orders: number;
  }[];
  topCustomers: {
    id: number;
    name: string;
    email: string | null;
    totalOrders: number;
  }[];
}

export async function fetchDashboardReports(): Promise<ReportData> {
  return await apiRequest<ReportData>("/api/reports");
}
