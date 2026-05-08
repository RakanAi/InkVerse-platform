import { useState } from "react";
import { Link } from "react-router-dom";

import {
  getTrendBadgeLabel,
  getTrendImageSrc,
} from "@/features/trends/trend.models";

export default function TrendSpotlightCard({
  trend,
  compact = false,
  badge = "Spotlight",
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = getTrendImageSrc(trend);
  const showImage = imageSrc && !imageFailed;

  return (
    <Link
      to={`/trend/${trend.id}`}
      className={`iv-trend-spotlight${compact ? " is-compact" : ""}`}
    >
      <div className="iv-trend-spotlight__media">
        {showImage ? (
          <img
            className="iv-trend-spotlight__image"
            src={imageSrc}
            alt={trend.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="iv-trend-fallback" aria-hidden="true">
            <span>{trend.name.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        <div className="iv-trend-spotlight__shade" />
      </div>

      <div className="iv-trend-spotlight__content">
        <div className="iv-trend-spotlight__eyebrowRow">
          <span className="iv-trend-badge">{badge}</span>
          <span className="iv-trend-badge iv-trend-badge--ghost">
            {getTrendBadgeLabel(trend)}
          </span>
        </div>

        <div className="iv-trend-spotlight__copy">
          <h2 className="iv-trend-spotlight__title">{trend.name}</h2>
          <p className="iv-trend-spotlight__text">{trend.description}</p>
        </div>

        <div className="iv-trend-spotlight__meta">
          <span className="iv-trend-spotlight__hint">Open collection</span>
          <span className="iv-trend-spotlight__cta">View trend</span>
        </div>
      </div>
    </Link>
  );
}
