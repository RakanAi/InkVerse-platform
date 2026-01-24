import api from "../Api/api.jsx";

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
