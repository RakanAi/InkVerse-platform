import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../../../Api/api";
import UserAvatar from "../../../Shared/user/UserAvatar";
import { canOpenPublicProfile, getPublicProfilePath } from "../../../domain/users/public-profile";
import ReportMenuButton from "../../../features/reports/ReportMenuButton";

function valueOf(item, camel, pascal = "") {
  return item?.[camel] ?? item?.[pascal || camel[0].toUpperCase() + camel.slice(1)];
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

function buildReplyTree(replies) {
  const nodes = replies.map((reply) => ({ reply, children: [] }));
  const byId = new Map(nodes.map((node) => [String(valueOf(node.reply, "id")), node]));
  const roots = [];

  nodes.forEach((node) => {
    const parentId = valueOf(node.reply, "parentReplyId");
    const parent = parentId == null ? null : byId.get(String(parentId));
    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function ReviewReplies({ reviewId, show, canReply, onCountChange }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [reactingId, setReactingId] = useState("");
  const [err, setErr] = useState("");
  const [replies, setReplies] = useState([]);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [nestedText, setNestedText] = useState("");

  const load = async () => {
    if (!reviewId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/reviews/${reviewId}/replies`);
      const nextReplies = Array.isArray(res.data) ? res.data : [];
      setReplies(nextReplies);
      onCountChange?.(nextReplies.length);
    } catch (e) {
      console.error("Load replies failed", e);
      setErr(t("bookPage.reviewReplies.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, reviewId]);

  useEffect(() => {
    setReplyingTo(null);
    setNestedText("");
  }, [reviewId, show]);

  const replyTree = useMemo(() => buildReplyTree(replies), [replies]);

  const submit = async (parentReply = null) => {
    const isNested = !!parentReply;
    const content = (isNested ? nestedText : text).trim();
    if (!content) return;

    if (!canReply) {
      setErr(t("bookPage.reviewReplies.loginRequired"));
      return;
    }

    setPosting(true);
    setErr("");
    try {
      await api.post(`/reviews/${reviewId}/replies`, {
        content,
        parentReplyId: parentReply ? valueOf(parentReply, "id") : null,
      });

      if (isNested) {
        setNestedText("");
        setReplyingTo(null);
      } else {
        setText("");
      }
      await load();
    } catch (e) {
      console.error("Post reply failed", e);
      setErr(
        e?.response?.status === 401 || e?.response?.status === 403
          ? t("bookPage.reviewReplies.loginRequired")
          : t("bookPage.reviewReplies.postError"),
      );
    } finally {
      setPosting(false);
    }
  };

  const reactToReply = async (reply, reactionType) => {
    const replyId = valueOf(reply, "id");
    if (!replyId || reactingId) return;

    try {
      setReactingId(`${replyId}:${reactionType}`);
      setErr("");
      await api.post(`/replies/${replyId}/react`, { reactionType });
      await load();
    } catch (e) {
      console.error("Reply reaction failed", e);
      setErr(
        e?.response?.status === 401 || e?.response?.status === 403
          ? t("bookPage.reviewCard.loginToReact")
          : t("bookPage.reviewReplies.postError"),
      );
    } finally {
      setReactingId("");
    }
  };

  const openNestedComposer = (reply) => {
    if (!canReply) {
      setErr(t("bookPage.reviewReplies.loginRequired"));
      return;
    }
    const replyId = valueOf(reply, "id");
    setReplyingTo((current) => (String(valueOf(current, "id") ?? "") === String(replyId) ? null : reply));
    setNestedText("");
  };

  if (!show) return null;

  const renderReply = (node, depth = 0, hasNextSibling = false) => {
    const reply = node.reply;
    const replyId = valueOf(reply, "id");
    const userName = valueOf(reply, "userName") ?? t("common.unknown");
    const userAvatarUrl = valueOf(reply, "userAvatarUrl") ?? "";
    const content = valueOf(reply, "content") ?? "";
    const createdAt = valueOf(reply, "createdAt");
    const updatedAt = valueOf(reply, "updatedAt");
    const edited =
      updatedAt &&
      createdAt &&
      new Date(updatedAt).getTime() > new Date(createdAt).getTime();
    const myReaction = String(valueOf(reply, "myReaction") ?? "").toLowerCase();
    const liked = myReaction === "like";
    const disliked = myReaction === "dislike";
    const isReplying = String(valueOf(replyingTo, "id") ?? "") === String(replyId);
    const parentUserName = valueOf(reply, "parentUserName");
    const canOpenProfile = canOpenPublicProfile(userName);
    const profilePath = canOpenProfile ? getPublicProfilePath(userName) : "";
    const articleClassName = [
      "iv-book-reply",
      depth > 0 ? "iv-book-reply--nested" : "",
      node.children.length ? "has-children" : "",
      hasNextSibling ? "has-next-sibling" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <article key={replyId} className={articleClassName}>
        <div className="iv-book-reply__row">
          {canOpenProfile ? (
            <Link
              to={profilePath}
              className="iv-book-reply__avatarLink"
              title={`View ${userName}`}
            >
              <UserAvatar
                className="iv-book-reply__avatar"
                src={userAvatarUrl}
                name={userName}
              />
            </Link>
          ) : (
            <div className="iv-book-reply__avatarSlot">
              <UserAvatar
                className="iv-book-reply__avatar"
                src={userAvatarUrl}
                name={userName}
              />
            </div>
          )}

          <div className="iv-book-reply__main">
            <div className="iv-book-reply__head">
              {canOpenProfile ? (
                <Link
                  to={profilePath}
                  className="iv-book-reply__author iv-book-reply__authorLink"
                  title={`View ${userName}`}
                >
                  {userName}
                </Link>
              ) : (
                <span className="iv-book-reply__author">{userName}</span>
              )}

              <div className="iv-book-reply__meta">
                <span className="iv-book-reply__date">{formatDate(createdAt)}</span>
                {edited ? (
                  <span className="iv-book-reply__edited">{t("bookPage.reviews.edited")}</span>
                ) : null}
              </div>
            </div>

            <div className="iv-book-reply__content">
              {parentUserName ? (
                <span className="iv-book-reply__mention">@{parentUserName}</span>
              ) : null}
              {content}
            </div>

            <div className="iv-book-reply__actions">
              <button
                type="button"
                className={`iv-book-reply__action ${liked ? "is-active is-positive" : ""}`}
                disabled={!!reactingId}
                onClick={() => reactToReply(reply, "like")}
              >
                <i className="bi bi-hand-thumbs-up" />
                <span>{valueOf(reply, "likes") ?? 0}</span>
              </button>
              <button
                type="button"
                className={`iv-book-reply__action ${disliked ? "is-active is-negative" : ""}`}
                disabled={!!reactingId}
                onClick={() => reactToReply(reply, "dislike")}
              >
                <i className="bi bi-hand-thumbs-down" />
                <span>{valueOf(reply, "dislikes") ?? 0}</span>
              </button>
              <button
                type="button"
                className="iv-book-reply__action"
                onClick={() => openNestedComposer(reply)}
              >
                <i className="bi bi-reply" />
                <span>{t("bookPage.reviewReplies.reply", { defaultValue: "Reply" })}</span>
              </button>
              <ReportMenuButton
                targetType="review_reply"
                targetId={replyId}
                targetLabel={t("bookPage.reviewReplies.reply", { defaultValue: "Reply" })}
                buttonClassName="iv-book-reply__report"
              />
            </div>

            {isReplying ? (
              <div className="iv-book-reply-composer">
                <textarea
                  className="iv-book-replies__textarea"
                  rows={1}
                  value={nestedText}
                  onChange={(event) => setNestedText(event.target.value)}
                  placeholder={`Reply to ${userName}...`}
                  disabled={posting}
                />
                <div className="iv-book-replies__actions">
                  <button
                    type="button"
                    className="iv-book-reply__action"
                    onClick={() => {
                      setReplyingTo(null);
                      setNestedText("");
                    }}
                    disabled={posting}
                  >
                    {t("common.cancel", { defaultValue: "Cancel" })}
                  </button>
                  <button
                    className="iv-book-review__action iv-book-review__action--primary"
                    type="button"
                    onClick={() => submit(reply)}
                    disabled={posting || !nestedText.trim()}
                  >
                    {posting
                      ? t("bookPage.reviewReplies.saving")
                      : t("bookPage.reviewReplies.reply", { defaultValue: "Reply" })}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {node.children.length ? (
          <div className="iv-book-reply__children">
            {node.children.map((child, index) =>
              renderReply(child, depth + 1, index < node.children.length - 1),
            )}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="iv-book-replies">
      <div className="iv-book-replies__header">
        <div className="iv-book-replies__title">{t("bookPage.reviewReplies.title")}</div>
        {loading ? (
          <span className="iv-book-replies__loading">
            {t("bookPage.reviewReplies.loadingShort")}
          </span>
        ) : null}
      </div>

      {err ? <div className="iv-book-replies__error">{err}</div> : null}

      <div
        className={[
          "iv-book-replies__list",
          replyTree.length ? "has-replies" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {replyTree.length === 0 && !loading ? (
          <div className="iv-book-replies__empty">{t("bookPage.reviewReplies.empty")}</div>
        ) : (
          replyTree.map((node) => renderReply(node))
        )}
      </div>

      <div className="iv-book-replies__composer">
        <textarea
          className="iv-book-replies__textarea"
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            canReply
              ? t("bookPage.reviewReplies.placeholder")
              : t("bookPage.reviewReplies.loginPlaceholder")
          }
          disabled={!canReply || posting}
        />

        <div className="iv-book-replies__actions">
          <button
            className="iv-book-review__action iv-book-review__action--primary"
            type="button"
            onClick={() => submit()}
            disabled={!canReply || posting || !text.trim()}
          >
            {posting ? t("bookPage.reviewReplies.saving") : t("bookPage.reviewReplies.reply")}
          </button>
        </div>
      </div>
    </div>
  );
}
