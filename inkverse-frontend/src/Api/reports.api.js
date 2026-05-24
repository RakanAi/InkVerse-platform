import api from "./api";

export function createContentReport(payload) {
  return api.post("/reports", payload).then((res) => res.data);
}

export function fetchAdminReports({ status = "", type = "" } = {}) {
  return api.get("/admin/reports", { params: { status, type } }).then((res) => res.data);
}

export function fetchAdminReport(id) {
  return api.get(`/admin/reports/${id}`).then((res) => res.data);
}

export function resolveAdminReport(id, adminNote = "") {
  return api.post(`/admin/reports/${id}/resolve`, { adminNote }).then((res) => res.data);
}

export function dismissAdminReport(id, adminNote = "") {
  return api.post(`/admin/reports/${id}/dismiss`, { adminNote }).then((res) => res.data);
}
