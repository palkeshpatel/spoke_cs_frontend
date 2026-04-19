import { apiRequest } from "@/services/api";

export type StaffWorkSession = {
  id: number;
  staff_id: number;
  work_date: string;
  start_time: string;
  pause_time: string | null;
  resume_time: string | null;
  complete_time: string | null;
  total_break_minutes: number;
  total_work_minutes: number;
  status: 'started' | 'paused' | 'resumed' | 'completed';
};

export type StaffAttendance = {
  id: number;
  staff_id: number;
  date: string;
  login_time: string | null;
  logout_time: string | null;
  total_hours: string;
  status: 'present' | 'absent' | 'leave';
  staff?: {
    name: string;
    role?: {
      role_name: string;
    };
  };
};

export async function getStaffWorkStatus() {
  return apiRequest<{ session: StaffWorkSession | null }>("/api/staff/work/status");
}

export async function startStaffWork() {
  return apiRequest<{ session: StaffWorkSession }>("/api/staff/work/start", { method: "POST" });
}

export async function pauseStaffWork() {
  return apiRequest<{ session: StaffWorkSession }>("/api/staff/work/pause", { method: "POST" });
}

export async function resumeStaffWork() {
  return apiRequest<{ session: StaffWorkSession }>("/api/staff/work/resume", { method: "POST" });
}

export async function completeStaffWork() {
  return apiRequest<{ session: StaffWorkSession }>("/api/staff/work/complete", { method: "POST" });
}

export async function getStaff() {
  return apiRequest<any[]>("/api/staff");
}

export async function getRoles() {
  return apiRequest<any[]>("/api/staff/roles");
}

export async function saveStaff(data: any) {
  if (data.id) {
    return apiRequest<any>(`/api/staff/${data.id}`, { method: "PUT", body: data });
  }
  return apiRequest<any>("/api/staff", { method: "POST", body: data });
}

export async function deleteStaff(id: number) {
  return apiRequest<{ message: string }>(`/api/staff/${id}`, { method: "DELETE" });
}

export async function getActiveStaff() {
  return apiRequest<{ staff: any[] }>("/api/admin/staff/active");
}

export async function getWorkReport(startDate: string, endDate: string) {
  return apiRequest<{ report: StaffAttendance[] }>(`/api/admin/reports/work?start_date=${startDate}&end_date=${endDate}`);
}
