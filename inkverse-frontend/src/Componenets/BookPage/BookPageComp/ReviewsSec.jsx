import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReviewCard from "./ReviewCard";

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
};

const toMs = (v) => {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d.getTime()) ? d.getTime() : 0;
};

export default function Reviews({ reviews = [], loading = false, onRefresh }) {
  const { t } = useTranslation();
  const [sortMode, setSortMode] = useState("newest");
  const isNewest = sortMode === "newest";

  const sorted = useMemo(() => {
    const list = Array.isArray(reviews) ? [...reviews] : [];
    list.sort((a, b) => {
      const aT = toMs(pick(a, "createdAt", "CreatedAt")) || toMs(pick(a, "updatedAt", "UpdatedAt"));
      const bT = toMs(pick(b, "createdAt", "CreatedAt")) || toMs(pick(b, "updatedAt", "UpdatedAt"));
      return sortMode === "newest" ? bT - aT : aT - bT;
    });
    return list;
  }, [reviews, sortMode]);

  if (loading) return <div className="iv-book-status">{t("bookPage.reviews.loading")}</div>;

  return (
    <section className="iv-book-section iv-book-section--plain iv-book-section--reviews">
      <div className="iv-book-section__head iv-book-section__head--reviews">
        <div className="iv-book-section__title-wrap">
          <span className="borderStart" />
          <div>
            <h3 className="iv-book-section__title">{t("bookPage.reviews.title")}</h3>
            <p className="iv-book-section__subtitle mb-0">
              {t("bookPage.reviews.subtitle")}
            </p>
          </div>
        </div>

        <div className="iv-book-reviews__actions">
          <span className="iv-book-reviews__count">
            {t("bookPage.reviews.count", { count: sorted.length })}
          </span>

          <label className="iv-book-sort-field">
            <span>{t("bookPage.reviews.sortLabel")}</span>
            <button
              type="button"
              className="iv-book-sort-toggle"
              onClick={() => setSortMode(isNewest ? "oldest" : "newest")}
              aria-pressed={!isNewest}
              aria-label={t("bookPage.reviews.sortAria", {
                mode: isNewest
                  ? t("bookPage.reviews.newestFirst")
                  : t("bookPage.reviews.oldestFirst"),
              })}
            >
              <span>
                {isNewest
                  ? t("bookPage.reviews.newestFirst")
                  : t("bookPage.reviews.oldestFirst")}
              </span>
              <i
                className={`bi ${isNewest ? "bi-arrow-down" : "bi-arrow-up"}`}
                aria-hidden="true"
              />
            </button>
          </label>
        </div>
      </div>

      <div className="iv-book-reviews__list">
        {sorted.length === 0 ? (
          <div className="iv-book-empty">{t("bookPage.reviews.empty")}</div>
        ) : (
          sorted.map((r, index) => (
            <ReviewCard
              key={r.id ?? r.Id}
              review={r}
              onRefresh={onRefresh}
              isLast={index === sorted.length - 1}
            />
          ))
        )}
      </div>
    </section>
  );
}
