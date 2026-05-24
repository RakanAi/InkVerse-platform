import { absUrl } from "../../Utils/absUrl";

export function getBookId(book) {
  return book?.id ?? book?.ID ?? 0;
}

export function getBookTitle(book) {
  return book?.title ?? book?.Title ?? "Untitled";
}

export function getBookDescription(book) {
  return book?.description ?? book?.Description ?? book?.synopsis ?? book?.Synopsis ?? "";
}

export function getBookCover(book) {
  const raw = book?.coverImageUrl ?? book?.CoverImageUrl ?? book?.coverUrl ?? book?.CoverUrl ?? "";
  return raw ? absUrl(raw) : "";
}

export function formatCompactNumber(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : "0";
}

export function formatRating(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

export function formatStudioDate(value) {
  if (!value) return "No recent update";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent update";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStatusLabel(value) {
  if (!value) return "Unknown";

  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
