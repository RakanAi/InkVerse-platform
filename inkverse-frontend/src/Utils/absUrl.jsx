import api from "../Api/api.jsx";

// Turns "/uploads/x.png" -> "https://localhost:5221/uploads/x.png"
export function absUrl(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // api base is ".../api" so strip it
  const apiBase = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${apiBase}${path}`;
}
