import api from "./api";

export async function fetchAdminBookContracts(status = "") {
  const params = status ? { status } : {};
  const res = await api.get("/admin/book-contracts", { params, timeout: 12000 });
  return Array.isArray(res.data) ? res.data : [];
}

export async function approveBookContract(bookId, note = "") {
  const res = await api.post(`/admin/book-contracts/${bookId}/approve`, { note }, { timeout: 12000 });
  return res.data ?? null;
}

export async function rejectBookContract(bookId, note) {
  const res = await api.post(`/admin/book-contracts/${bookId}/reject`, { note }, { timeout: 12000 });
  return res.data ?? null;
}

export async function revokeBookContract(bookId, note = "") {
  const res = await api.post(`/admin/book-contracts/${bookId}/revoke`, { note }, { timeout: 12000 });
  return res.data ?? null;
}

export async function fetchAuthorBookContract(bookId) {
  const res = await api.get(`/author/books/${bookId}/contract`, { timeout: 12000 });
  return res.data ?? null;
}

export async function attestAuthorBookRights(bookId) {
  const res = await api.post(`/author/books/${bookId}/contract/attest-rights`, {}, { timeout: 12000 });
  return res.data ?? null;
}
