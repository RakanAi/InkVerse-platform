export const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_abuse", label: "Hate or abuse" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "violence", label: "Violence" },
  { value: "illegal_content", label: "Illegal content" },
  { value: "copyright_ip", label: "Copyright / IP" },
  { value: "impersonation", label: "Impersonation" },
  { value: "private_information", label: "Private information" },
  { value: "other", label: "Other" },
];

export const REPORT_TARGET_LABELS = {
  book: "Book",
  review: "Review",
  review_reply: "Review reply",
  chapter_comment: "Comment",
  user: "User",
};

export function getReportReasonLabel(value) {
  return REPORT_REASONS.find((reason) => reason.value === value)?.label || value || "Unknown";
}

export function getReportTargetLabel(value) {
  return REPORT_TARGET_LABELS[value] || value || "Unknown";
}
