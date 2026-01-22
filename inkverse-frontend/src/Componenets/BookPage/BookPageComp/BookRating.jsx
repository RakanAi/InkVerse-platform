import React from "react";



// Pass rating as a number (like 3.5, 4, etc.)
export default function BookRating({ rating = 0 }) {
  const maxStars = 5;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="align-items-center gap-1 my-2">
      {[...Array(fullStars)].map((_, i) => (
        <i key={`full-${i}`} className="bi bi-star-fill text-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="6"
            height="6"
            fill="currentColor"
            class="bi bi-star-fill"
            viewBox="0 0 16 16"
          >
          </svg>
        </i>
      ))}
      {hasHalfStar && (
        <i className="bi bi-star-half text-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="6"
            height="6"
            fill="currentColor"
            class="bi bi-star-half"
            viewBox="0 0 16 16"
          >
          </svg>
        </i>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <i key={`empty-${i}`} className="bi bi-star text-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="6"
            height="6"
            fill="currentColor"
            class="bi bi-star"
            viewBox="0 0 16 16"
          >
          </svg>
        </i>
      ))}
      <span className="ms-2 responsive small">({rating.toFixed(1)})</span>
    </div>
  );
}
