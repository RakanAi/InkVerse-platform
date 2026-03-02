export function parseTrendId(idParam) {
  const n = Number(idParam);
  return Number.isFinite(n) && n > 0 ? n : null;
}