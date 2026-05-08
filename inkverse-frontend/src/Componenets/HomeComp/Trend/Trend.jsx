import Carousel from "react-bootstrap/Carousel";
import "./Trend.css";

import { absUrl } from "../../../Utils/absUrl";
import LinkButton from "@/Shared/ui/LinkButton";
import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";
import ErrorState from "@/Shared/ui/ErrorState";
import HomeSection from "@/features/home/shared/HomeSection";
import useHomeCollection from "@/features/home/shared/useHomeCollection";
import {
  TRENDS_LABELS,
  TRENDS_QUERY,
} from "@/features/home/trends/trends.presets";
import {
  getCollectionItems,
  normalizeHomeTrendPreview,
  shuffleItems,
} from "@/features/home/shared/home.models";

function selectTrendingItems(data) {
  return shuffleItems(getCollectionItems(data))
    .slice(0, TRENDS_QUERY.take)
    .map(normalizeHomeTrendPreview);
}

export default function TrendCora() {
  const { items: trends, loading, error } = useHomeCollection({
    endpoint: "/trends",
    errorMessage: TRENDS_LABELS.error,
    selectItems: selectTrendingItems,
  });

  return (
    <HomeSection
      className="iv-trends"
      title={TRENDS_LABELS.title}
      subtitle={TRENDS_LABELS.subtitle}
      actions={
        <LinkButton to="/trend" variant="outline" size="sm">
          {TRENDS_LABELS.cta}
        </LinkButton>
      }
    >
      {loading ? (
        <LoadingState text={TRENDS_LABELS.loading} />
      ) : error ? (
        <ErrorState title={error} />
      ) : trends.length === 0 ? (
        <EmptyState title={TRENDS_LABELS.empty} />
      ) : (
        <Carousel className="iv-trends__carousel" interval={5000} pause="hover">
          {trends.map((trend) => (
            <Carousel.Item key={trend.id}>
              <img
                className="iv-trends__img"
                src={absUrl(trend.imageUrl)}
                alt={trend.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="iv-trends__overlay" />
              <div className="iv-trends__caption text-white">
                <div className="iv-trends__badge">{TRENDS_LABELS.badge}</div>
                <p className="iv-trends__title text-white">{trend.name}</p>
                {trend.description ? (
                  <p className="iv-trends__desc">{trend.description}</p>
                ) : null}
                <LinkButton
                  to={`/trend/${trend.id}`}
                  variant="ghost"
                  size="sm"
                  className="iv-trends__cta"
                >
                  {TRENDS_LABELS.action}
                </LinkButton>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      )}
    </HomeSection>
  );
}
