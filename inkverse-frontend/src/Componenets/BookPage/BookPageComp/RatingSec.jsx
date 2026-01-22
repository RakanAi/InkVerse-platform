import React, { useMemo } from "react";
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

function damageLabel(v) {
  switch (Math.round(v)) {
    case 1:
      return "I'm destroyed 💀";
    case 2:
      return "Pain 😭";
    case 3:
      return "Ouch 🥲";
    case 4:
      return "Soft hurt 😔";
    case 5:
      return "No damage 😌";
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
        label: "Character Accuracy",
        value: characterAccuracy,
      },
      {
        key: "chemistryRelationships",
        label: "Chemistry & Relationships",
        value: chemistryRelationships,
      },
      {
        key: "plotCreativity",
        label: "Plot & Creativity",
        value: plotCreativity,
      },
      {
        key: "canonIntegration",
        label: "Canon Integration",
        value: canonIntegration,
      },
      {
        key: "emotionalDamage",
        label: "Emotional Damage",
        value: emotionalDamage,
        helper: "Lower stars = higher damage 😈",
        valueText: damageLabel(emotionalDamage),
      },
    ];
  }, [
    characterAccuracy,
    chemistryRelationships,
    plotCreativity,
    canonIntegration,
    emotionalDamage,
  ]);

  const hasBreakdown = entries.some((e) => Number(e.value) > 0);

  return (
    <div className="row mx-0 my-4 g-3">
      {/* LEFT */}
      <div className="col-12 col-lg-5">
        <div className="p-4 border rounded shadow-sm h-100">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-bold">Ratings</h5>
            <span className="text-muted small">{totalReviews} reviews</span>
          </div>

          <div className="my-3 d-flex align-items-center gap-3 ">
            <div
              style={{ fontSize: "3rem", lineHeight: 1 }}
              className="fw-bold"
            >
              {clamp(averageRating).toFixed(1)}
            </div>
            <div>
              <RatingEle rating={clamp(averageRating)} />
              <div className="text-muted small mt-1">Average rating</div>
            </div>
          </div>

          <div className="d-flex flex-column m-auto w-50">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onWriteReview}
            >
              {myReview ? "Edit your review" : "Write a review"}
            </button>

            {myReview && (
              <button
                className="btn btn-outline-link "
                type="button"
                onClick={onDeleteMyReview}
                style={{ textDecoration: "none" }}
              >
                Delete your review
              </button>
            )}
          </div>
          <hr />
          {/* {authorNote ? (
            <div className="mt-4 p-3 bg-light rounded">
              <div className="fw-semibold mb-1">Author note</div>
              <div className="small text-muted">{authorNote}</div>
            </div>
          ) : null} */}
        </div>
      </div>

      {/* RIGHT */}
      <div className="col-12 col-lg-7">
        <div className="p-4 border rounded shadow-sm h-100">
          <h5 className="mb-3 fw-bold">Category breakdown</h5>

          {hasBreakdown ? (
            <div className="d-flex flex-column gap-3">
              {entries.map(({ key, label, value, helper, valueText }) => {
                const v = clamp(value);
                const percent = (v / 5) * 100;

                return (
                  <div key={key}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="fw-semibold">
                        {label}
                        {helper ? (
                          <div className="text-muted small fw-normal">
                            {helper}
                          </div>
                        ) : null}
                      </div>

                      <div className="d-flex flex-column align-items-end">
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted small">
                            {v.toFixed(1)}
                          </span>
                          <RatingEle rating={v} />
                        </div>

                        {valueText ? (
                          <div className="text-muted small">{valueText}</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="progress mt-2" style={{ height: "8px" }}>
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
            <div className="text-muted">No detailed ratings yet.</div>
          )}

          <div className="text-muted small mt-3">
            Breakdown updates as reviews are added.
          </div>
        </div>
      </div>
    </div>
  );
}
