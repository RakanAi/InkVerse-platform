import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function StarRatingInput({ value = 0, onChange, showValueText, valueText }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="d-flex align-items-center gap-2">
      <div className="d-flex align-items-center gap-1">
        {stars.map((star) => {
          const isFilled = star <= value;

          return (
            <i
              key={star}
              className={`bi ${isFilled ? "bi-star-fill" : "bi-star"} text-warning fs-4`}
              style={{ cursor: "pointer" }}
              onClick={() => onChange(star)}
              title={`${star}/5`}
            />
          );
        })}
      </div>

      {showValueText ? (
        <span className="text-muted small">{valueText ?? `(${value}/5)`}</span>
      ) : null}
    </div>
  );
}
