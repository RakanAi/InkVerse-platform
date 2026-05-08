import { useState } from "react";
import { Link } from "react-router-dom";

import {
  getTrendBadgeLabel,
  getTrendImageSrc,
} from "@/features/trends/trend.models";

export default function TrendCollectionCard({ trend }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = getTrendImageSrc(trend);
  const showImage = imageSrc && !imageFailed;

  return (
    <Link to={`/trend/${trend.id}`} className="iv-trend-collectionCard">
      <div className="iv-trend-collectionCard__media">
        {showImage ? (
          <img
            className="iv-trend-collectionCard__image"
            src={imageSrc}
            alt={trend.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="iv-trend-fallback iv-trend-fallback--soft" aria-hidden="true">
            <span>{trend.name.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="iv-trend-collectionCard__body">
        <div className="iv-trend-collectionCard__row">
          <span className="iv-trend-badge iv-trend-badge--soft">
            {getTrendBadgeLabel(trend)}
          </span>
        </div>

        <div className="iv-trend-collectionCard__copy">
          <h3 className="iv-trend-collectionCard__title">{trend.name}</h3>
          <p className="iv-trend-collectionCard__text">{trend.description}</p>
        </div>

        <div className="iv-trend-collectionCard__footer">
          <span className="iv-trend-collectionCard__cta">Explore trend</span>
        </div>
      </div>
    </Link>
  );
}
