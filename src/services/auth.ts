import { apiRequest, clearAuthToken, setAuthToken } from "@/services/api";

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
  notification_count: number;
  today_wishes: WishNotification[];
};

export async function loginWithPassword(email: string, password: string, remember = true) {
  const res = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setAuthToken(res.token, remember);
  return res;
}

export async function requestOtp(email: string) {
  return apiRequest<{ ok: boolean; message: string; debug_otp?: string }>("/api/auth/request-otp", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export async function verifyOtp(email: string, otp: string, remember = true) {
  const res = await apiRequest<AuthResponse>("/api/auth/verify-otp", {
    method: "POST",
    auth: false,
    body: { email, otp },
  });
  setAuthToken(res.token, remember);
  return res;
}

export async function getMe() {
  return apiRequest<{ user: AuthUser; notification_count: number; today_wishes: WishNotification[] }>("/api/auth/me");
}

export async function logout() {
  try {
    await apiRequest<{ message: string }>("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}
