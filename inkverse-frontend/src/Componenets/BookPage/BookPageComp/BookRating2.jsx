import React from "react";
import "./Data.css";

export default function RatingEle({ rating = 0, variant = "default" }) {
  const maxStars = 5;
  const safe = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  const isHero = variant === "hero";

  const fullStars = Math.floor(safe);
  const hasHalfStar = safe - fullStars >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`iv-rating-ele ${isHero ? "iv-rating-ele--hero" : ""}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <i key={`full-${i}`} className="bi bi-star-fill iv-rating-ele__star" />
      ))}

      {hasHalfStar && <i className="bi bi-star-half iv-rating-ele__star" />}

      {Array.from({ length: emptyStars }).map((_, i) => (
        <i key={`empty-${i}`} className="bi bi-star iv-rating-ele__star iv-rating-ele__star--empty" />
      ))}

      <span className="iv-rating-ele__value">({safe.toFixed(1)})</span>
    </div>
  );
}
