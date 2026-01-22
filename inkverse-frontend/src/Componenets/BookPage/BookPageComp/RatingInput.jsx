import React from "react";

export default function RatingInput({ label, value, onChange }) {
  return (
    <div className="my-3 text-start d-flex border-end">
      <span className="fw-semibold d-inline-block" style={{ width: "180px" }}>{label}:</span>
      <div className="col-auto gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi ${star <= value ? "bi-star-fill" : "bi-star"} text-warning`}
            style={{ cursor: "pointer", fontSize: "1.2rem" }}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );
}
