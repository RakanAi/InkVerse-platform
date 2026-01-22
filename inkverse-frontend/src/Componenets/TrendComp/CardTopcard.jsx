import React from "react";
import "./Card.css";

const FALLBACK = "/src/assets/BackGround_04.png"; // use your existing fallback if you want

const API_ORIGIN = "https://localhost:5221";

const absUrl = (u) => {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return API_ORIGIN + u;
  return API_ORIGIN + "/" + u;
};

export default function CardTopcard({ trend, onClick, variant = "hero" }) {
  if (!trend) return null;

const imgUrl = absUrl(trend.imageUrl ?? trend.ImageUrl);

  return (
    <div
      className={`cardTopcard-container ${variant}`}
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${imgUrl})`,
        maxWidth: "300px",
      }}
      role="button"
      onClick={onClick}
    >
      <div className="cardTopc">
        <div className="front-content">
          <p className="m-0 align-self-end mb-3">{trend.name}</p>
        </div>

        <div className="content">
          <p className="heading">{trend.slug ? `${trend.slug}` : "Trend"}</p>
          <div className="m-0 disc">
            {trend.description?.trim()
              ? trend.description
              : "Explore this curated collection."}
          </div>

          <div className="mt-2">
            <span className="badge bg-light text-dark me-2">
              {trend.isActive ? "Active" : "Hidden"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
