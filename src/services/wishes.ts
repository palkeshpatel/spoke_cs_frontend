import { apiRequest } from "@/services/api";
import type { WishNotification } from "@/services/auth";

export type ReceivedWish = {
  id: number;
  notification_type: "birthday" | "anniversary";
  wished_at: string;
  from_user: {
    id: number;
    name: string;
    role_name: string | null;
  } | null;
};

export type WishesResponse = {
  notification_count: number;
  today_wishes: WishNotification[];
  notifications: WishNotification[];
  received_wishes: ReceivedWish[];
};

export async function getWishNotifications() {
  return apiRequest<WishesResponse>("/api/notifications");
}

export async function markWishNotificationRead(id: number) {
  return apiRequest<{ message: string; notification_count: number }>(`/api/notifications/${id}/read`, {
    method: "POST",
  });
}

export async function markAllWishNotificationsRead() {
  return apiRequest<{ message: string; updated: number; notification_count: number }>("/api/notifications/read-all", {
    method: "POST",
  });
}
