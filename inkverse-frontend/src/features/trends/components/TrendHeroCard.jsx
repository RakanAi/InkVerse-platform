import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getTrendBadgeLabel,
  getTrendImageSrc,
} from "@/features/trends/trend.models";

export default function TrendHeroCard({ trend }) {
  const { t } = useTranslation();
  const imageSrc = getTrendImageSrc(trend);
  const description =
    trend.description?.trim() || t("common.books.curatedCollection");

  return (
    <Link
      to={`/trend/${trend.id}`}
      className="iv-trend-heroCard"
      style={
        imageSrc
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(9, 13, 30, 0.12), rgba(6, 8, 20, 0.78)), url(${imageSrc})`,
            }
          : undefined
      }
    >
      {!imageSrc ? (
        <div className="iv-trend-heroCard__fallback" aria-hidden="true">
          <span>{trend.name.slice(0, 1).toUpperCase()}</span>
        </div>
      ) : null}

      <div className="iv-trend-heroCard__content">
        <div className="iv-trend-heroCard__badges">
          <span className="iv-trend-heroCard__badge">{t("trends.cards.trendingConcept")}</span>
          <span className="iv-trend-heroCard__badge iv-trend-heroCard__badge--ghost">
            {getTrendBadgeLabel(trend)}
          </span>
        </div>

        <div className="iv-trend-heroCard__copy">
          <h2 className="iv-trend-heroCard__title">{trend.name}</h2>
          <p className="iv-trend-heroCard__text">{description}</p>
        </div>

        <span className="iv-trend-heroCard__cta">{t("trends.cards.exploreTrend")}</span>
      </div>
    </Link>
  );
}
