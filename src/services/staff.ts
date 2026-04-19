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
  const isEdit = !!data.id;
  const url = isEdit ? `/api/staff/${data.id}` : "/api/staff";
  
  // If we have a file, use FormData
  if (data.profile_photo instanceof File) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    
    if (isEdit) {
      formData.append('_method', 'PUT'); // Spoof PUT for Lumen/Laravel
    }
    
    return apiRequest<any>(url, {
      method: "POST", // Always use POST for multipart
      body: formData,
    });
  }

  return apiRequest<any>(url, {
    method: isEdit ? "PUT" : "POST",
    body: data,
  });
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
