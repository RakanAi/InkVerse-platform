export function canOpenPublicProfile(userName = "") {
  const value = String(userName || "").trim();
  if (!value) return false;

  const normalized = value.toLowerCase();
  return normalized !== "deleted" && normalized !== "unknown";
}

export function getPublicProfilePath(userName = "") {
  const value = String(userName || "").trim();
  return `/users/${encodeURIComponent(value)}`;
}
