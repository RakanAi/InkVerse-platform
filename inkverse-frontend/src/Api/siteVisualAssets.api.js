import api from "./api";

export async function fetchSiteVisualAssets() {
  const res = await api.get("/site-visual-assets", { timeout: 12000 });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchAdminSiteVisualAssets() {
  const res = await api.get("/admin/site-visual-assets", { timeout: 12000 });
  return Array.isArray(res.data) ? res.data : [];
}

export async function updateAdminSiteVisualAsset(slotKey, payload) {
  const res = await api.put(`/admin/site-visual-assets/${slotKey}`, payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function uploadSiteVisualAsset(file, { slotKey } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (slotKey) form.append("EntityName", slotKey);
  form.append("Purpose", "image");

  const res = await api.post("/uploads/site-visuals", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000,
  });

  return res.data?.url || "";
}
