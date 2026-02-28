import React from "react";
import "./BookCover.css";
import { FALLBACK_COVER } from "@/domain/books/book-cover";

export default function BookCover({
  src,
  alt = "Book cover",
  variant = "tile", // tile | list | mini | hero
  className = "",
  rounded = true,
}) {
  return (
    <div className={`iv-cover iv-cover--${variant} ${rounded ? "is-rounded" : ""} ${className}`}>
      <img
        src={src || FALLBACK_COVER}
        alt={alt}
        loading="lazy"
        className="iv-cover__img"
      />
    </div>
  );
}