import api from "./api";

export async function fetchNotifications(params = {}) {
  const response = await api.get("/me/notifications", { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchUnreadNotificationCount() {
  const response = await api.get("/me/notifications/unread-count");
  return Number(response.data?.unreadCount ?? response.data?.UnreadCount ?? 0);
}

export async function markNotificationRead(id) {
  const response = await api.post(`/me/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.post("/me/notifications/read-all");
  return response.data;
}

export async function deleteNotification(id) {
  await api.delete(`/me/notifications/${id}`);
}

export async function fetchNotificationPreferences() {
  const response = await api.get("/me/notification-preferences");
  return Array.isArray(response.data) ? response.data : [];
}

export async function updateNotificationPreferences(preferences) {
  const response = await api.put("/me/notification-preferences", { preferences });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchFollowStatus(userName) {
  const response = await api.get(`/users/${encodeURIComponent(userName)}/follow-status`);
  return response.data;
}

export async function followAuthor(userName) {
  const response = await api.post(`/users/${encodeURIComponent(userName)}/follow`);
  return response.data;
}

export async function unfollowAuthor(userName) {
  const response = await api.delete(`/users/${encodeURIComponent(userName)}/follow`);
  return response.data;
}

export async function sendSystemNotification(payload) {
  const response = await api.post("/admin/notifications/system", payload);
  return response.data;
}
