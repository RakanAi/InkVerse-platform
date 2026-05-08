import { Link } from "react-router-dom";
import "./TagSec.css";
import tagArt from "../../../assets/Diamond.jpeg";

import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import LinkButton from "@/Shared/ui/LinkButton";
import HomeSection from "@/features/home/shared/HomeSection";
import useHomeCollection from "@/features/home/shared/useHomeCollection";

import { TOPTAGS_QUERY, TOPTAGS_LABELS } from "@/features/home/toptags/toptags.presets";
import { buildPopularTagsEndpoint } from "@/features/home/toptags/utils/buildPopularTagsEndpoint";
import { getTagName } from "@/features/home/toptags/utils/getTagName";
import { getCollectionItems } from "@/features/home/shared/home.models";

export default function TopTags() {
  const endpoint = buildPopularTagsEndpoint(TOPTAGS_QUERY);
  const {
    items: bookTags,
    loading,
    error,
    refetch,
  } = useHomeCollection({
    endpoint,
    errorMessage: TOPTAGS_LABELS.error,
    selectItems: getCollectionItems,
  });

  return (
    <HomeSection
      className="iv-home-tags"
      title={TOPTAGS_LABELS.title}
      subtitle={TOPTAGS_LABELS.subtitle}
      actions={
        <LinkButton to="/Browser" variant="outline" size="sm">
          {TOPTAGS_LABELS.cta}
        </LinkButton>
      }
    >
      <div className="iv-home-tags__body">
        <div className="iv-home-tags__visual">
          <img src={tagArt} alt="InkVerse tags artwork" className="iv-home-tags__visualImg" />
          <div className="iv-home-tags__visualOverlay" />
          <div className="iv-home-tags__visualCard">
            <span className="iv-home-tags__badge">{TOPTAGS_LABELS.badge}</span>
            <p className="iv-home-tags__hint">{TOPTAGS_LABELS.visualHint}</p>
          </div>
        </div>

        <div className="iv-home-tags__content">
          <div className="iv-home-tags__contentHead">
            <p className="iv-home-tags__contentKicker">{TOPTAGS_LABELS.directoryKicker}</p>
            <p className="iv-home-tags__contentText">{TOPTAGS_LABELS.directoryText}</p>
          </div>

          {loading ? (
            <LoadingState text={TOPTAGS_LABELS.loading} />
          ) : error ? (
            <ErrorState title={error} subtitle="Please try again." onRetry={refetch} />
          ) : !bookTags?.length ? (
            <EmptyState title={TOPTAGS_LABELS.empty} subtitle={null} />
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
