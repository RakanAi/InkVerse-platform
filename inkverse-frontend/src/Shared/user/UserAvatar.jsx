import { useMemo, useState } from "react";
import { absUrl } from "../../Utils/absUrl";
import "./UserAvatar.css";

export function getUserInitials(name = "") {
  const text = String(name || "").trim();
  if (!text) return "IV";

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }

  return text.slice(0, 2).toUpperCase();
}

export function getUserAvatarSrc(rawAvatar = "") {
  const value = String(rawAvatar || "").trim();
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  return absUrl(value);
}

export default function UserAvatar({
  name = "",
  src = "",
  className = "",
  alt = "",
  title = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedSrc = useMemo(() => getUserAvatarSrc(src), [src]);

  if (!resolvedSrc || imageFailed) {
    return (
      <span
        className={`${className} iv-user-avatar-fallback`.trim()}
        aria-label={alt || name || "User avatar"}
        title={title || name || ""}
      >
        {getUserInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || name || "User avatar"}
      title={title || name || ""}
      className={className}
      onError={() => setImageFailed(true)}
    />
  );
}
