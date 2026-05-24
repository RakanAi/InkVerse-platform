import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getTrendBadgeLabel,
  getTrendImageSrc,
} from "@/features/trends/trend.models";

export default function TrendRevealCard({ trend }) {
  const { t } = useTranslation();
  const imageSrc = getTrendImageSrc(trend);
  const description =
    trend.description?.trim() || t("common.books.curatedCollection");

  return (
    <Link
      to={`/trend/${trend.id}`}
      className="iv-trend-revealCard"
      style={
        imageSrc
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(7, 10, 24, 0.22), rgba(7, 10, 24, 0.52)), url(${imageSrc})`,
            }
          : undefined
      }
    >
      {!imageSrc ? (
        <div className="iv-trend-revealCard__fallback" aria-hidden="true">
          <span>{trend.name.slice(0, 1).toUpperCase()}</span>
        </div>
      ) : null}

      <div className="iv-trend-revealCard__front">
        <span className="iv-trend-revealCard__slug">
          #{getTrendBadgeLabel(trend)}
        </span>
        <h3 className="iv-trend-revealCard__title">{trend.name}</h3>
      </div>

      <div className="iv-trend-revealCard__overlay">
        <span className="iv-trend-revealCard__eyebrow">{t("trends.cards.curatedTrend")}</span>
        <h3 className="iv-trend-revealCard__overlayTitle">{trend.name}</h3>
        <p className="iv-trend-revealCard__text">{description}</p>
        <span className="iv-trend-revealCard__cta">{t("trends.cards.openTrend")}</span>
      </div>
    </Link>
  );
}
