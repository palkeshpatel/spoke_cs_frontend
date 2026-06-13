import { apiRequest, clearAuthToken, setAuthToken, setSessionBranch } from "@/services/api";

export type Permission = {
  id: number;
  permission_name: string;
  module: string;
};

export type Role = {
  id: number;
  role_name: string;
  permissions?: Permission[];
};

export type AuthUser = {
  id: number;
  branch_id?: number | null;
  name: string;
  email: string;
  role_id: number | null;
  role?: string | Role;
  role_record?: Role;
  roleRecord?: Role;
};

export type WishNotification = {
  id: number;
  recipient_user_id: number;
  source_user_id: number;
  notification_type: "birthday" | "anniversary";
  event_date: string;
  title: string;
  body: string;
  read_at: string | null;
  is_read: boolean;
  source_user: {
    id: number;
    name: string;
    role_name: string | null;
  } | null;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  branch?: {
    id: number;
    name: string;
    code: string;
  } | null;
  notification_count: number;
  today_wishes: WishNotification[];
};

export async function loginWithPassword(email: string, password: string, branchId: number, remember = true) {
  const res = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password, branch_id: branchId },
  });
  setAuthToken(res.token, remember);
  setSessionBranch(res.branch ?? null, remember);
  return res;
}

export async function requestOtp(email: string, branchId: number) {
  return apiRequest<{ ok: boolean; message: string; debug_otp?: string }>("/api/auth/request-otp", {
    method: "POST",
    auth: false,
    body: { email, branch_id: branchId },
  });
}

export async function verifyOtp(email: string, otp: string, branchId: number, remember = true) {
  const res = await apiRequest<AuthResponse>("/api/auth/verify-otp", {
    method: "POST",
    auth: false,
    body: { email, otp, branch_id: branchId },
  });
  setAuthToken(res.token, remember);
  setSessionBranch(res.branch ?? null, remember);
  return res;
}

export async function getMe() {
  return apiRequest<{
    user: AuthUser;
    branch?: { id: number; name: string; code: string } | null;
    notification_count: number;
    today_wishes: WishNotification[];
  }>("/api/auth/me");
}

export async function logout() {
  try {
    await apiRequest<{ message: string }>("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}
