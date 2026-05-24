import api from "./api";

export function fetchAdminModerationCases(params = {}) {
  return api.get("/admin/moderation/cases", { params }).then((res) => res.data);
}

export function fetchAdminModerationCase(id) {
  return api.get(`/admin/moderation/cases/${id}`).then((res) => res.data);
}

export function decideAdminModerationCase(id, payload) {
  return api.post(`/admin/moderation/cases/${id}/decision`, payload).then((res) => res.data);
}

export function addAdminModerationMessage(id, payload) {
  return api.post(`/admin/moderation/cases/${id}/messages`, payload).then((res) => res.data);
}

export function runAdminClawbotModeration(take = 50) {
  return api.post("/admin/moderation/run-clawbot", { take }).then((res) => res.data);
}
