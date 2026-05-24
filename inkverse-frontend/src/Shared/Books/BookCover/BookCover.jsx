import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./BookCover.css";
import { FALLBACK_COVER } from "@/domain/books/book-cover";

function getFallbackMark(alt) {
  const words = String(alt || "No cover")
    .replace(/book cover/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!words.length) return "IV";

  return words.map((word) => word[0]?.toUpperCase() || "").join("");
}

function getFallbackTitle(title, alt) {
  const value = String(title || alt || "")
    .replace(/book cover/i, "")
    .trim();

  return value || "Untitled Story";
}

function isFallbackCoverSrc(value) {
  const src = String(value || "");
  return Boolean(FALLBACK_COVER && (src === FALLBACK_COVER || src.endsWith(FALLBACK_COVER)));
}

export default function BookCover({
  src,
  alt = "Book cover",
  title = "",
  variant = "tile", // tile | list | mini | hero
  className = "",
  rounded = true,
}) {
  const { t } = useTranslation();
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK_COVER || "");
  const [renderFallbackPanel, setRenderFallbackPanel] = useState(!(src || FALLBACK_COVER));

  useEffect(() => {
    const nextSrc = src || FALLBACK_COVER || "";
    setCurrentSrc(nextSrc);
    setRenderFallbackPanel(!nextSrc);
  }, [src]);

  const fallbackMark = useMemo(() => getFallbackMark(alt), [alt]);
  const fallbackTitle = useMemo(() => getFallbackTitle(title, alt), [alt, title]);
  const isTemplateFallback = !renderFallbackPanel && isFallbackCoverSrc(currentSrc);

  const handleError = () => {
    if (currentSrc !== FALLBACK_COVER && FALLBACK_COVER) {
      setCurrentSrc(FALLBACK_COVER);
      return;
    }

    setRenderFallbackPanel(true);
  };

  return (
    <div className={`iv-cover iv-cover--${variant} ${rounded ? "is-rounded" : ""} ${className}`}>
      {!renderFallbackPanel && currentSrc ? (
        <>
          <img
            src={currentSrc}
            alt={alt}
            loading="lazy"
            className="iv-cover__img"
            onError={handleError}
          />
          {isTemplateFallback ? (
            <div className="iv-cover__templateTitle" aria-hidden="true">
              <span>{fallbackTitle}</span>
            </div>
          ) : null}
        </>
      ) : (
        <div className="iv-cover__fallback" aria-label={alt}>
          <span className="iv-cover__fallbackMark">{fallbackMark}</span>
          <span className="iv-cover__fallbackLabel">{t("bookPage.cover.noCover")}</span>
        </div>
      )}
    </div>
  );
}
