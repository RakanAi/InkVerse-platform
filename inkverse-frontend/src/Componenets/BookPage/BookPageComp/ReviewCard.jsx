import React, { useMemo, useState, useContext } from "react";
import RatingEle from "./BookRating2";
import "./Data.css";
import api from "../../../Api/api";
import ReviewReplies from "./ReviewReplies";
import AuthContext from "../../../Context/AuthProvider";
import { absUrl } from "../../../Utils/absUrl";

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

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function ReviewCard({ review, onRefresh }) {
  const [open, setOpen] = useState(false);

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
        alert("You must be logged in to react.");
      }
    } finally {
      setReacting(false);
    }
  };

  const userName = review?.userName ?? review?.UserName ?? "Unknown";

  const avatarUrl =
    review?.userAvatarUrl ??
    review?.UserAvatarUrl ??
    review?.avatarUrl ??
    review?.AvatarUrl ??
    review?.profilePictureUrl ??
    review?.ProfilePictureUrl ??
    "";

  const avatarSrc = avatarUrl ? absUrl(avatarUrl) : "";

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName || "User",
  )}`;

  const imgSrc = avatarSrc || fallbackAvatar;

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
  console.log("REVIEW OBJ:", review);
  console.log("AVATAR URL PICKED:", avatarUrl);
  console.log("AVATAR SRC:", avatarSrc);
  const createdAt = review?.createdAt ?? review?.CreatedAt;
  const updatedAt = review?.updatedAt ?? review?.UpdatedAt;
  const edited =
    updatedAt &&
    createdAt &&
    new Date(updatedAt).getTime() > new Date(createdAt).getTime();

  return (
    <div className="p-3 border rounded shadow my-3">
      {/* header */}
      <div className="d-flex align-items-center mb-2">
        <img
          src={imgSrc}
          alt={userName}
          className="rounded-circle"
          width={70}
          height={70}
          style={{ objectFit: "cover" }}
          onError={(e) => {
            e.currentTarget.src = fallbackAvatar;
          }}
        />

        <div className="text-start mx-3">
          <strong>{userName}</strong>
          <div className="text-muted small fst-italic">
            {formatDate(createdAt)}
            {edited ? (
              <span className="ms-2 badge text-bg-secondary">Edited</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* content */}
      <div className="my-2 text-start">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 text-center col-4">
          <RatingEle rating={rating} />
          {breakdown.hasAny ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Hide breakdown" : "View breakdown"}
            </button>
          ) : null}
        </div>

        {content ? (
          <p className="mt-2 mb-2">{content}</p>
        ) : (
          <p className="mt-2 mb-2 text-muted fst-italic">No content.</p>
        )}

        {/* breakdown panel */}
        {breakdown.hasAny ? (
          <div
            className={`review-breakdown mt-3 p-3 rounded border bg-light ${open ? "open" : ""}`}
          >
            <div className="d-flex flex-column gap-2">
              <Row
                label="Character Accuracy"
                value={breakdown.characterAccuracy}
              />
              <Row
                label="Chemistry & Relationships"
                value={breakdown.chemistryRelationships}
              />
              <Row label="Plot & Creativity" value={breakdown.plotCreativity} />
              <Row
                label="Canon Integration"
                value={breakdown.canonIntegration}
              />

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">Emotional Damage</div>
                  <div className="text-muted small">
                    Lower stars = higher damage 😈
                  </div>
                </div>
                <div className="text-end">
                  <div className="d-flex justify-content-end">
                    <RatingEle rating={breakdown.emotionalDamage} />
                  </div>
                  <div className="text-muted small">
                    {damageLabel(breakdown.emotionalDamage)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="d-flex gap-2 mt-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowReplies((v) => !v)}
          >
            {showReplies ? "Hide replies" : `View replies (${replyCount})`}
          </button>
        </div>

        <ReviewReplies
          reviewId={reviewId}
          show={showReplies}
          canReply={canReply}
          onCountChange={(n) => setReplyCount(n)}
        />

        {/* footer actions */}
        <div className="d-flex align-items-center gap-3 text-muted small mt-3">
          <button
            className={`btn btn-sm d-flex align-items-center gap-1 ${
              liked ? "btn-success" : "btn-outline-success"
            }`}
            onClick={() => handleReact("like")}
            disabled={reacting}
            type="button"
          >
            <i className="bi bi-hand-thumbs-up" />
            <span>{review?.likes ?? review?.Likes ?? 0}</span>
          </button>

          <button
            className={`btn btn-sm d-flex align-items-center gap-1 ${
              disliked ? "btn-danger" : "btn-outline-danger"
            }`}
            onClick={() => handleReact("dislike")}
            disabled={reacting}
            type="button"
          >
            <i className="bi bi-hand-thumbs-down" />
            <span>{review?.dislikes ?? review?.Dislikes ?? 0}</span>
          </button>

          <span role="button">⋯</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="d-flex justify-content-between align-items-center">
      <div className="fw-semibold">{label}</div>
      <RatingEle rating={value} />
    </div>
  );
}
