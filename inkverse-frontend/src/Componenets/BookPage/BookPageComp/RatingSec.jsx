import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import RatingEle from "./BookRating2";

function clamp(n, min = 0, max = 5) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function getVal(breakdown, camel, pascal) {
  // supports either: breakdown.characterAccuracy OR breakdown.CharacterAccuracy
  const v = breakdown?.[camel] ?? breakdown?.[pascal];
  return clamp(v);
}

function damageLabel(t, v) {
  switch (Math.round(v)) {
    case 1:
      return t("bookPage.rating.damageLevels.High");
    case 2:
      return t("bookPage.rating.damageLevels.Heavy");
    case 3:
      return t("bookPage.rating.damageLevels.Medium");
    case 4:
      return t("bookPage.rating.damageLevels.Light");
    case 5:
      return t("bookPage.rating.damageLevels.Safe");
    default:
      return "";
  }
}

export default function RatingBox({
  averageRating,
  totalReviews,
  breakdown,
  onWriteReview,
  myReview,
  onDeleteMyReview,
}) {
  const { t } = useTranslation();
  // ✅ read values safely
  const characterAccuracy = getVal(
    breakdown,
    "characterAccuracy",
    "CharacterAccuracy"
  );
  const chemistryRelationships = getVal(
    breakdown,
    "chemistryRelationships",
    "ChemistryRelationships"
  );
  const plotCreativity = getVal(breakdown, "plotCreativity", "PlotCreativity");
  const canonIntegration = getVal(
    breakdown,
    "canonIntegration",
    "CanonIntegration"
  );
  const emotionalDamage = getVal(
    breakdown,
    "emotionalDamage",
    "EmotionalDamage"
  ); // stored raw (1=MAX, 5=NO)

  const entries = useMemo(() => {
    return [
      {
        key: "characterAccuracy",
        label: t("bookPage.rating.categories.characterAccuracy"),
        value: characterAccuracy,
      },
      {
        key: "chemistryRelationships",
        label: t("bookPage.rating.categories.chemistryRelationships"),
        value: chemistryRelationships,
      },
      {
        key: "plotCreativity",
        label: t("bookPage.rating.categories.plotCreativity"),
        value: plotCreativity,
      },
      {
        key: "canonIntegration",
        label: t("bookPage.rating.categories.canonIntegration"),
        value: canonIntegration,
      },
      {
        key: "emotionalDamage",
        label: t("bookPage.rating.categories.emotionalDamage"),
        value: emotionalDamage,
        helper: t("bookPage.rating.damageHelper"),
        valueText: damageLabel(t, emotionalDamage),
      },
    ];
  }, [
    t,
    characterAccuracy,
    chemistryRelationships,
    plotCreativity,
    canonIntegration,
    emotionalDamage,
  ]);

  const hasBreakdown = entries.some((e) => Number(e.value) > 0);

  return (
    <section className="iv-book-section iv-book-section--plain iv-book-rating-row">
      <div className="iv-book-section__head">
        <div className="iv-book-section__title-wrap">
          <span className="borderStart" />
          <div>
            <h3 className="iv-book-section__title">{t("bookPage.rating.title")}</h3>
            <p className="iv-book-section__subtitle mb-0">
              {t("bookPage.rating.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="iv-book-rating__grid">
        <div className="iv-book-rating__summary">
          <div className="iv-book-rating__summary-top">
            <div className="iv-book-rating__score">
              {clamp(averageRating).toFixed(1)}
            </div>
            <div className="iv-book-rating__score-copy">
              <RatingEle rating={clamp(averageRating)} />
              <div className="iv-book-rating__score-note">{t("bookPage.rating.averageLabel")}</div>
            </div>
          </div>

          <div className="iv-book-rating__meta">
            <span className="iv-book-rating__meta-pill">
              {t("bookPage.rating.reviewCount", { count: totalReviews })}
            </span>
            <span className="iv-book-rating__meta-copy">
              {t("bookPage.rating.liveCopy")}
            </span>
          </div>

          <div className="iv-book-rating__actions">
            <button
              className="iv-book-review__action iv-book-review__action--primary"
              type="button"
              onClick={onWriteReview}
            >
              {myReview ? t("bookPage.rating.editReview") : t("bookPage.rating.writeReview")}
            </button>

            {myReview && (
              <button
                className="iv-book-review__action"
                type="button"
                onClick={onDeleteMyReview}
              >
                {t("bookPage.rating.deleteReview")}
              </button>
            )}
          </div>
        </div>

        <div className="iv-book-rating__details">
          <div className="iv-book-rating__details-head">
            <h4 className="iv-book-rating__details-title">{t("bookPage.rating.breakdownTitle")}</h4>
            <span className="iv-book-rating__details-note">
              {t("bookPage.rating.breakdownSubtitle")}
            </span>
          </div>

          {hasBreakdown ? (
            <div className="iv-book-rating__list">
              {entries.map(({ key, label, value, helper, valueText }) => {
                const v = clamp(value);
                const percent = (v / 5) * 100;

                return (
                  <div className="iv-book-rating__item" key={key}>
                    <div className="iv-book-rating__item-head">
                      <div className="iv-book-rating__label-wrap">
                        <div className="iv-book-rating__label">{label}</div>
                        {helper ? (
                          <div className="iv-book-rating__helper">{helper}</div>
                        ) : null}
                      </div>

                      <div className="iv-book-rating__value-wrap">
                        <div className="iv-book-rating__value-row">
                          <span className="iv-book-rating__value">{v.toFixed(1)}</span>
                          <RatingEle rating={v} />
                        </div>

                        {valueText ? (
                          <div className="iv-book-rating__value-text">{valueText}</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="progress iv-book-rating__progress" style={{ height: "8px" }}>
                      <div
                        className="progress-bar"
                        style={{ width: `${percent}%` }}
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="iv-book-empty">{t("bookPage.rating.empty")}</div>
          )}
        </div>
      </div>
    </section>
  );
}
