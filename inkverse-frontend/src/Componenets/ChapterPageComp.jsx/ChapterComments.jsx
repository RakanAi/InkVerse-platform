import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../../Api/api";
import AuthContext from "../../Context/AuthProvider";
import UserAvatar from "../../Shared/user/UserAvatar";
import { canOpenPublicProfile, getPublicProfilePath } from "../../domain/users/public-profile";
import ReportMenuButton from "../../features/reports/ReportMenuButton";
import "./ChapterComment.css";

export default function ChapterComments({
  chapterId,
  surface = "standalone",
  theme = "mist",
  paragraphId = null,
  paragraphText = "",
  onClearParagraphContext,
  onCommentsChanged,
}) {
  const { t } = useTranslation();
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const getCid = (comment) => comment?.id ?? comment?.Id ?? comment?.ID;
  const getUserId = (comment) =>
    comment?.userId ?? comment?.UserId ?? comment?.userID ?? comment?.UserID;
  const getUserName = (comment) =>
    comment?.userName ?? comment?.UserName ?? comment?.username ?? comment?.Username;
  const getUserAvatarUrl = (comment) =>
    comment?.userAvatarUrl ??
    comment?.UserAvatarUrl ??
    comment?.avatarUrl ??
    comment?.AvatarUrl ??
    "";
  const getLikes = (comment) => comment?.likes ?? comment?.Likes ?? 0;
  const getDislikes = (comment) => comment?.dislikes ?? comment?.Dislikes ?? 0;
  const getMyReaction = (comment) =>
    comment?.myReaction ?? comment?.MyReaction ?? 0;
  const getContent = (comment) => comment?.content ?? comment?.Content ?? "";
  const getParagraphId = (comment) =>
    comment?.paragraphId ?? comment?.ParagraphId ?? null;

  const loadComments = useCallback(async () => {
    if (!chapterId) return;

    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/chapters/${chapterId}/comments`, {
        params: paragraphId ? { paragraphId } : undefined,
      });
      const nextComments = Array.isArray(response.data) ? response.data : [];
      setComments(nextComments);
      onCommentsChanged?.(nextComments);
    } catch (err) {
      console.error("Load comments failed:", err);
      setError(t("reader.comments.errors.load"));
      setComments([]);
      onCommentsChanged?.([]);
    } finally {
      setLoading(false);
    }
  }, [chapterId, onCommentsChanged, paragraphId, t]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    setReplyTo(null);
    setError("");
  }, [chapterId, paragraphId]);

  const visibleComments = useMemo(() => {
    if (!paragraphId) return comments;

    return comments.filter(
      (comment) => String(getParagraphId(comment) ?? "") === String(paragraphId),
    );
  }, [comments, paragraphId]);

  const post = async () => {
    const content = text.trim();
    if (!content) return;

    try {
      setError("");
      await api.post(`/chapters/${chapterId}/comments`, {
        content,
        paragraphId: replyTo?.paragraphId ?? paragraphId ?? null,
        parentCommentId: replyTo?.id ?? null,
      });
      setText("");
      setReplyTo(null);
      await loadComments();
    } catch (err) {
      console.error("Post comment failed:", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError(t("reader.comments.errors.signInComment"));
        return;
      }
      setError(t("reader.comments.errors.post"));
    }
  };

  const reactTo = async (commentId, value) => {
    try {
      setError("");
      await api.post(`/comments/${commentId}/reaction`, { value });
      await loadComments();
    } catch (err) {
      console.error("React failed:", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError(t("reader.comments.errors.signInReact"));
        return;
      }
      setError(t("reader.comments.errors.react"));
    }
  };

  const deleteComment = async (commentId) => {
    try {
      setError("");
      await api.delete(`/comments/${commentId}`);
      await loadComments();
    } catch (err) {
      console.error("Delete failed:", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError(t("reader.comments.errors.signIn"));
        return;
      }
      setError(t("reader.comments.errors.delete"));
    }
  };

  const updateComment = async (commentId, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      setError("");
      await api.put(`/comments/${commentId}`, { content: trimmed });
      setEditingId(null);
      await loadComments();
    } catch (err) {
      console.error("Edit failed:", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError(t("reader.comments.errors.signIn"));
        return;
      }
      setError(t("reader.comments.errors.edit"));
    }
  };

  const CommentItem = ({ comment, depth = 0 }) => {
    const commentId = String(getCid(comment) ?? "");
    const isOwner =
      myUserId && String(getUserId(comment) ?? "") === String(myUserId);
    const isEditing = String(editingId ?? "") === commentId;
    const [localEditText, setLocalEditText] = useState(getContent(comment));

    useEffect(() => {
      if (!isEditing) setLocalEditText(getContent(comment));
    }, [comment, isEditing]);

    const createdAt = comment?.createdAt ?? comment?.CreatedAt;
    const updatedAt = comment?.updatedAt ?? comment?.UpdatedAt;

    const wasEdited = useMemo(() => {
      if (!updatedAt || !createdAt) return false;
      return Math.abs(new Date(updatedAt) - new Date(createdAt)) > 60_000;
    }, [createdAt, updatedAt]);

    return (
      <div className="iv-comment" style={{ marginLeft: depth * 18 }}>
        <div className="iv-comment-card">
          <div className="iv-comment-top">
            {canOpenPublicProfile(getUserName(comment) || "") ? (
              <Link
                to={getPublicProfilePath(getUserName(comment) || "")}
                className="iv-comment-who iv-comment-whoLink"
                title={`View ${getUserName(comment) || t("reader.comments.unknownReader")}`}
              >
                <UserAvatar
                  className="iv-comment-avatar"
                  src={getUserAvatarUrl(comment)}
                  name={getUserName(comment) || t("reader.comments.unknownReader")}
                />
                <div className="iv-comment-who__copy">
                  <div className="iv-comment-author">
                    {getUserName(comment) || t("reader.comments.unknownReader")}
                  </div>
                  <div className="iv-comment-time">
                    {createdAt ? new Date(createdAt).toLocaleString() : ""}
                    {wasEdited ? (
                      <span className="iv-comment-edited"> • {t("reader.comments.edited")}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="iv-comment-who">
                <UserAvatar
                  className="iv-comment-avatar"
                  src={getUserAvatarUrl(comment)}
                  name={getUserName(comment) || t("reader.comments.unknownReader")}
                />
                <div className="iv-comment-who__copy">
                  <div className="iv-comment-author">
                    {getUserName(comment) || t("reader.comments.unknownReader")}
                  </div>
                  <div className="iv-comment-time">
                    {createdAt ? new Date(createdAt).toLocaleString() : ""}
                    {wasEdited ? (
                      <span className="iv-comment-edited"> • {t("reader.comments.edited")}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div className="iv-comment-reactions">
              <button
                className={`iv-react-btn ${
                  getMyReaction(comment) === 1 ? "is-active-up" : ""
                }`}
                type="button"
                onClick={() => reactTo(commentId, 1)}
              >
                <i className="bi bi-hand-thumbs-up" />
                <span>{getLikes(comment)}</span>
              </button>

              <button
                className={`iv-react-btn ${
                  getMyReaction(comment) === -1 ? "is-active-down" : ""
                }`}
                type="button"
                onClick={() => reactTo(commentId, -1)}
              >
                <i className="bi bi-hand-thumbs-down" />
                <span>{getDislikes(comment)}</span>
              </button>

              <ReportMenuButton
                targetType="chapter_comment"
                targetId={commentId}
                targetLabel={t("reader.comments.comment", { defaultValue: "Comment" })}
                buttonClassName="iv-react-btn iv-react-btn--more"
              />
            </div>
          </div>

          {isEditing ? (
            <div className="iv-comment-editor">
              <textarea
                className="iv-comment-field iv-comment-field--edit"
                rows={4}
                value={localEditText}
                onChange={(event) => setLocalEditText(event.target.value)}
                autoFocus
              />

              <div className="iv-comment-editor__actions">
                <button
                  className="iv-comment-secondary"
                  type="button"
                  onClick={() => setEditingId(null)}
                >
                  {t("common.actions.cancel")}
                </button>
                <button
                  className="iv-comment-primary"
                  type="button"
                  onClick={() => updateComment(commentId, localEditText)}
                  disabled={!localEditText.trim()}
                >
                  {t("common.actions.saveChanges")}
                </button>
              </div>
            </div>
          ) : (
            <div className="iv-comment-text">{getContent(comment)}</div>
          )}

          <div className="iv-comment-actions">
            {!isEditing ? (
              <button
                className="iv-comment-reply"
                type="button"
                onClick={() =>
                  setReplyTo({
                    id: commentId,
                    paragraphId: getParagraphId(comment) ?? paragraphId ?? null,
                    userName: getUserName(comment) || t("reader.comments.reader"),
                  })
                }
              >
                {t("reader.comments.reply")}
              </button>
            ) : (
              <span />
            )}

            {isOwner && !isEditing ? (
              <div className="iv-comment-owner-actions">
                <button
                  className="iv-icon-btn"
                  type="button"
                  title={t("reader.comments.editComment")}
                  onClick={() => setEditingId(commentId)}
                >
                  <i className="bi bi-pencil-square" />
                </button>

                <button
                  className="iv-icon-btn"
                  type="button"
                  title={t("reader.comments.deleteComment")}
                  onClick={() => {
                    if (window.confirm(t("reader.comments.confirmDelete"))) {
                      deleteComment(commentId);
                    }
                  }}
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {Array.isArray(comment?.replies)
          ? comment.replies.map((reply) => (
              <CommentItem
                key={String(getCid(reply))}
                comment={reply}
                depth={depth + 1}
              />
            ))
          : null}
      </div>
    );
  };

  return (
    <div
      className={`iv-comments-shell ${
        surface === "drawer" ? "iv-comments-shell--drawer" : ""
      } iv-comments-shell--${theme} ${
        surface === "drawer" ? "iv-comments-shell--in-reader-drawer" : ""
      }`}
    >
      <div className="iv-comments-head">
        <div>
          <span className="iv-comments-kicker">{t("reader.comments.kicker")}</span>
          <h2>{paragraphId ? t("reader.comments.passageTitle") : t("reader.comments.title")}</h2>
          <p>
            {paragraphId
              ? t("reader.comments.passageSubtitle")
              : t("reader.comments.subtitle")}
          </p>
        </div>

        <div className="iv-comments-head__actions">
          {paragraphId && onClearParagraphContext ? (
            <button
              className="iv-comment-secondary"
              type="button"
              onClick={onClearParagraphContext}
            >
              {t("reader.comments.showAll")}
            </button>
          ) : null}

          <button
            className="iv-comment-secondary"
            type="button"
            onClick={loadComments}
          >
            {t("reader.comments.refresh")}
          </button>
        </div>
      </div>

      {paragraphId ? (
        <div className="iv-comment-context">
          <span className="iv-comment-context__label">{t("reader.comments.selectedParagraph")}</span>
          <p>{paragraphText || t("reader.comments.highlightedFallback")}</p>
        </div>
      ) : null}

      <div className="iv-comment-composer">
        {replyTo ? (
          <div className="iv-comment-replying">
            <span>
              {t("reader.comments.replyingTo", {
                user: replyTo.userName ? replyTo.userName : `#${replyTo.id}`,
              })}
            </span>
            <button
              className="iv-comment-replying__clear"
              type="button"
              onClick={() => setReplyTo(null)}
            >
              {t("common.actions.cancel")}
            </button>
          </div>
        ) : null}

        <textarea
          className="iv-comment-field"
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            paragraphId
              ? t("reader.comments.placeholders.paragraph")
              : t("reader.comments.placeholders.chapter")
          }
        />

        <div className="iv-comment-composebar">
          <span className="iv-comment-composehint">
            {auth?.user?.userName
              ? t("reader.comments.commentingAs", { user: auth.user.userName })
              : t("reader.comments.signInPrompt")}
          </span>

          <button
            className="iv-comment-primary"
            type="button"
            onClick={post}
            disabled={!text.trim()}
          >
            {t("reader.comments.post")}
          </button>
        </div>

        {error ? <div className="iv-comment-error">{error}</div> : null}
      </div>

      {loading ? (
        <div className="iv-comments-state">{t("reader.comments.loading")}</div>
      ) : visibleComments.length ? (
        <div className="iv-comments-list">
          {visibleComments.map((comment) => (
            <CommentItem key={String(getCid(comment))} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="iv-comments-state">
          {paragraphId
            ? t("reader.comments.emptyParagraph")
            : t("reader.comments.emptyChapter")}
        </div>
      )}
    </div>
  );
}
