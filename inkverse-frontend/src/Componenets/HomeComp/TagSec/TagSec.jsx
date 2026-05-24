import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./TagSec.css";
import tagArt from "../../../assets/Diamond.jpeg";

import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import LinkButton from "@/Shared/ui/LinkButton";
import HomeSection from "@/features/home/shared/HomeSection";
import useHomeCollection from "@/features/home/shared/useHomeCollection";

import { TOPTAGS_QUERY, getTopTagsLabels } from "@/features/home/toptags/toptags.presets";
import { buildPopularTagsEndpoint } from "@/features/home/toptags/utils/buildPopularTagsEndpoint";
import { getTagName } from "@/features/home/toptags/utils/getTagName";
import { getCollectionItems } from "@/features/home/shared/home.models";

export default function TopTags() {
  const { t } = useTranslation();
  const labels = getTopTagsLabels(t);
  const endpoint = buildPopularTagsEndpoint(TOPTAGS_QUERY);
  const {
    items: bookTags,
    loading,
    error,
    refetch,
  } = useHomeCollection({
    endpoint,
    errorMessage: labels.error,
    selectItems: getCollectionItems,
  });

  return (
    <HomeSection
      className="iv-home-tags"
      title={labels.title}
      subtitle={labels.subtitle}
      actions={
        <LinkButton to="/Browser" variant="outline" size="sm">
          {labels.cta}
        </LinkButton>
      }
    >
      <div className="iv-home-tags__body">
        <div className="iv-home-tags__visual">
          <img src={tagArt} alt={labels.visualAlt} className="iv-home-tags__visualImg" />
          <div className="iv-home-tags__visualOverlay" />
          <div className="iv-home-tags__visualCard">
            <span className="iv-home-tags__badge">{labels.badge}</span>
            <p className="iv-home-tags__hint">{labels.visualHint}</p>
          </div>
        </div>

        <div className="iv-home-tags__content">
          <div className="iv-home-tags__contentHead">
            <p className="iv-home-tags__contentKicker">{labels.directoryKicker}</p>
            <p className="iv-home-tags__contentText">{labels.directoryText}</p>
          </div>

          {loading ? (
            <LoadingState text={labels.loading} />
          ) : error ? (
            <ErrorState title={error} subtitle={labels.errorSubtitle} onRetry={refetch} />
          ) : !bookTags?.length ? (
            <EmptyState title={labels.empty} subtitle={null} />
          ) : (
            <div className="iv-home-tags__cloud">
              {bookTags.map((tag, index) => {
                const name = getTagName(tag);
                if (!name) return null;

                return (
                  <Link
                    key={tag.id ?? tag.ID ?? index}
                    to={`/Browser?tag=${encodeURIComponent(name)}`}
                    className="iv-home-tags__chip"
                  >
                    #{name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </HomeSection>
  );
}
