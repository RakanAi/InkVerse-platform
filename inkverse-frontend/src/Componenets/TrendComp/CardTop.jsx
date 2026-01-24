import React from "react";
import "./Card.css";
import { absUrl } from "../../Utils/absUrl";

const FALLBACK =
  "/src/assets/BackGround_04.png"; // use your existing fallback if you want



export default function CardTop({ trend, onClick, variant = "hero" }) {
  if (!trend) return null;

  const bg = absUrl(trend.imageUrl ?? trend.ImageUrl);

  return (
    <div
      className={`cardTop-container ${variant}`}
      style={{
backgroundImage: `
  linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)),
  url(${bg})
`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",      }}
      role="button"
      onClick={onClick}
    >
      <div className="cardTop">
        <div className="front-content">
          <p className="m-0">{trend.slug ? `#${trend.slug}` : "Trend"}</p>
        </div>

        <div className="content">
          <p className="heading">{trend.name}</p>
          <p className="m-0">
            {trend.description?.trim()
              ? trend.description
              : "Explore this curated collection."}
          </p>


        </div>
      </div>
    </div>
  );
}
