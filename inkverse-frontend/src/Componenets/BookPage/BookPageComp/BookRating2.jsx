import React from "react";
import "./Data.css";

export default function RatingEle({ rating = 0 }) {
  const maxStars = 5;
  const safe = Number.isFinite(Number(rating)) ? Number(rating) : 0;

  const fullStars = Math.floor(safe);
  const hasHalfStar = safe - fullStars >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="justify-content-center my-auto text-lg-start text-center border-thick">
      {Array.from({ length: fullStars }).map((_, i) => (
        <i key={`full-${i}`} className="bi bi-star-fill text-warning" />
      ))}

      {hasHalfStar && <i className="bi bi-star-half text-warning" />}

      {Array.from({ length: emptyStars }).map((_, i) => (
        <i key={`empty-${i}`} className="bi bi-star text-warning" />
      ))}

      <span className="ms-2 responsive small">({safe.toFixed(1)})</span>
    </div>
  );
}
