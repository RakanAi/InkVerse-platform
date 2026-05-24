import React, { useMemo, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import RatingEle from "./BookRating2";
import "./Data.css";
import api from "../../../Api/api";
import ReviewReplies from "./ReviewReplies";
import AuthContext from "../../../Context/AuthProvider";
import UserAvatar from "../../../Shared/user/UserAvatar";
import { canOpenPublicProfile, getPublicProfilePath } from "../../../domain/users/public-profile";
import ReportMenuButton from "../../../features/reports/ReportMenuButton";

function clamp(n, min = 0, max = 5) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function getVal(review, camel, pascal) {
  return clamp(review?.[camel] ?? review?.[pascal] ?? 0);
}

function damageLabel(v) {
  switch (Math.round(v)) {
    case 1:
      return "High";
    case 2:
      return "Heavy";
    case 3:
      return "Medium";
    case 4:
      return "Light";
    case 5:
      return "Safe";
    default:
      return "";
  }
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReviewCard({ review, onRefresh, isLast = false }) {
  const { t } = useTranslation();
  const { auth } = useContext(AuthContext);
  const canReply = !!auth?.accessToken;

  const [showReplies, setShowReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(
    review?.replyCount ?? review?.ReplyCount ?? 0,
  );

  const reviewId = review?.id ?? review?.Id;
  const [reacting, setReacting] = useState(false);

  const handleReact = async (type) => {
    if (reacting) return;
    setReacting(true);

    try {
      await api.post(`/reviews/${reviewId}/react`, {
        reactionType: type,
      });

      // ✅ IMPORTANT: reload from server
      if (onRefresh) await onRefresh(true);
    } catch (e) {
      console.error("Reaction failed", e);

      if (e?.response?.status === 401) {
        alert(t("bookPage.reviewCard.loginToReact"));
      }
    } finally {
      setReacting(false);
    }
  };

  const userName = review?.userName ?? review?.UserName ?? t("common.unknown");

  const avatarUrl =
    review?.userAvatarUrl ??
    review?.UserAvatarUrl ??
    review?.avatarUrl ??
    review?.AvatarUrl ??
    review?.profilePictureUrl ??
    review?.ProfilePictureUrl ??
    "";
  const canViewProfile = canOpenPublicProfile(userName);
  const profilePath = canViewProfile ? getPublicProfilePath(userName) : null;

  const content = review?.content ?? review?.Content ?? "";
  const rating = clamp(review?.rating ?? review?.Rating ?? 0);

  const myReaction = (
    review?.myReaction ??
    review?.MyReaction ??
    ""
  ).toLowerCase();
  const liked = myReaction === "like";
  const disliked = myReaction === "dislike";

  const breakdown = useMemo(() => {
    const characterAccuracy = getVal(
      review,
      "characterAccuracy",
      "CharacterAccuracy",
    );
    const chemistryRelationships = getVal(
      review,
      "chemistryRelationships",
      "ChemistryRelationships",
    );
    const plotCreativity = getVal(review, "plotCreativity", "PlotCreativity");
    const canonIntegration = getVal(
      review,
      "canonIntegration",
      "CanonIntegration",
    );
    const emotionalDamage = getVal(
      review,
      "emotionalDamage",
      "EmotionalDamage",
    );

    const hasAny =
      characterAccuracy ||
      chemistryRelationships ||
      plotCreativity ||
      canonIntegration ||
      emotionalDamage;

    return {
      hasAny,
      characterAccuracy,
      chemistryRelationships,
      plotCreativity,
      canonIntegration,
      emotionalDamage,
    };
  }, [review]);
  const createdAt = review?.createdAt ?? review?.CreatedAt;
  const updatedAt = review?.updatedAt ?? review?.UpdatedAt;
  const edited =
    updatedAt &&
    createdAt &&
    new Date(updatedAt).getTime() > new Date(createdAt).getTime();

  const metrics = breakdown.hasAny
    ? [
        { label: "Characters", value: breakdown.characterAccuracy.toFixed(1) },
        {
          label: "Chemistry",
          value: breakdown.chemistryRelationships.toFixed(1),
        },
        { label: "Plot", value: breakdown.plotCreativity.toFixed(1) },
        { label: "Canon", value: breakdown.canonIntegration.toFixed(1) },
        { label: "Impact", value: damageLabel(breakdown.emotionalDamage) },
      ]
    : [];

  const translatedMetrics = metrics.map((metric) => ({
    ...metric,
    label:
      {
        Characters: t("bookPage.reviewCard.metrics.characters"),
        Chemistry: t("bookPage.reviewCard.metrics.chemistry"),
        Plot: t("bookPage.reviewCard.metrics.plot"),
        Canon: t("bookPage.reviewCard.metrics.canon"),
        Impact: t("bookPage.reviewCard.metrics.impact"),
      }[metric.label] ?? metric.label,
    value:
      {
        High: t("bookPage.rating.damageLevels.High"),
        Heavy: t("bookPage.rating.damageLevels.Heavy"),
        Medium: t("bookPage.rating.damageLevels.Medium"),
        Light: t("bookPage.rating.damageLevels.Light"),
        Safe: t("bookPage.rating.damageLevels.Safe"),
      }[metric.value] ?? metric.value,
  }));

  return (
    <article className={`iv-book-review ${isLast ? "is-last" : ""}`}>
      <div className="iv-book-review__head">
        {profilePath ? (
          <Link
            to={profilePath}
            className="iv-book-review__identity iv-book-review__identityLink"
            title={`View ${userName}`}
          >
            <UserAvatar
              src={avatarUrl}
              name={userName}
              className="iv-book-review__avatar"
            />

            <div className="iv-book-review__identity-copy">
              <div className="iv-book-review__author">
                <strong>{userName}</strong>
                {edited ? <span className="iv-book-review__edited">{t("bookPage.reviews.edited")}</span> : null}
              </div>
              <div className="iv-book-review__date">{formatDate(createdAt)}</div>
            </div>
          </Link>
        ) : (
          <div className="iv-book-review__identity">
            <UserAvatar
              src={avatarUrl}
              name={userName}
              className="iv-book-review__avatar"
            />

            <div className="iv-book-review__identity-copy">
              <div className="iv-book-review__author">
                <strong>{userName}</strong>
                {edited ? <span className="iv-book-review__edited">{t("bookPage.reviews.edited")}</span> : null}
              </div>
              <div className="iv-book-review__date">{formatDate(createdAt)}</div>
            </div>
          </div>
        )}

        <div className="iv-book-review__score">
          <span className="iv-book-review__score-number">
            {rating.toFixed(1)}
          </span>
          <RatingEle rating={rating} />
        </div>
      </div>

      <div className="iv-book-review__body">
        {content ? (
          <p className="iv-book-review__content">{content}</p>
        ) : (
          <p className="iv-book-review__content iv-book-review__content--muted">
            {t("bookPage.reviewCard.noWrittenReview")}
          </p>
        )}

        {metrics.length ? (
          <div className="iv-book-review__metrics" aria-label={t("bookPage.reviewCard.detailedRatings")}>
            {translatedMetrics.map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        ) : null}

        <div className="iv-book-review__actions">
          <button
            className={`iv-book-review__action ${
              liked ? "is-active is-positive" : ""
            }`}
            onClick={() => handleReact("like")}
            disabled={reacting}
            type="button"
          >
            <i className="bi bi-hand-thumbs-up" />
            <span>{t("bookPage.reviewCard.helpful")}</span>
            <span>{review?.likes ?? review?.Likes ?? 0}</span>
          </button>

          <button
            className={`iv-book-review__action ${
              disliked ? "is-active is-negative" : ""
            }`}
            onClick={() => handleReact("dislike")}
            disabled={reacting}
            type="button"
          >
            <i className="bi bi-hand-thumbs-down" />
            <span>{t("bookPage.reviewCard.notForMe")}</span>
            <span>{review?.dislikes ?? review?.Dislikes ?? 0}</span>
          </button>

          <button
            type="button"
            className={`iv-book-review__action ${showReplies ? "is-active" : ""}`}
            onClick={() => setShowReplies((v) => !v)}
          >
            <i className={`bi ${showReplies ? "bi-chat-square-text-fill" : "bi-chat-square-text"}`} />
            <span>{showReplies ? t("bookPage.reviewCard.hideReplies") : t("bookPage.reviewCard.replies")}</span>
            <span>{replyCount}</span>
          </button>

          <ReportMenuButton
            targetType="review"
            targetId={reviewId}
            targetLabel={t("bookPage.reviewCard.review", { defaultValue: "Review" })}
            buttonClassName="iv-book-review__action iv-book-review__action--more"
          />
        </div>

        <ReviewReplies
          reviewId={reviewId}
          show={showReplies}
          canReply={canReply}
          onCountChange={(n) => setReplyCount(n)}
        />
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <span className="iv-book-review__metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}
