import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import AuthContext from "../../Context/AuthProvider";
import "./ChapterComment.css"

export default function ChapterComments({ chapterId }) {
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Normalize common casing differences
  const getCid = (c) => c?.id ?? c?.Id ?? c?.ID;
  const getUserId = (c) => c?.userId ?? c?.UserId ?? c?.userID ?? c?.UserID;
  const getUserName = (c) => c?.userName ?? c?.UserName ?? c?.username ?? c?.Username;
  const getLikes = (c) => c?.likes ?? c?.Likes ?? 0;
  const getDislikes = (c) => c?.dislikes ?? c?.Dislikes ?? 0;
  const getMyReaction = (c) => c?.myReaction ?? c?.MyReaction ?? 0;
  const getContent = (c) => c?.content ?? c?.Content ?? "";

  const loadComments = useCallback(async () => {
    if (!chapterId) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/chapters/${chapterId}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Load comments failed:", e);
      setError("Failed to load comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const post = async () => {
    const content = text.trim();
    if (!content) return;

    try {
      setError("");
      await api.post(`/chapters/${chapterId}/comments`, {
        content,
        parentCommentId: replyTo ?? null,
      });
      setText("");
      setReplyTo(null);
      await loadComments();
    } catch (e) {
      console.error("Post comment failed:", e);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        setError("Please sign in to comment.");
        return;
      }
      setError("Failed to post comment.");
    }
  };

  const reactTo = async (commentId, value) => {
    try {
      setError("");
      await api.post(`/comments/${commentId}/reaction`, { value });
      await loadComments();
    } catch (e) {
      console.error("React failed:", e);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        setError("Please sign in to react.");
        return;
      }
      setError("Failed to react.");
    }
  };

  const deleteComment = async (commentId) => {
    try {
      setError("");
      await api.delete(`/comments/${commentId}`);
      await loadComments();
    } catch (e) {
      console.error("Delete failed:", e);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        setError("Please sign in.");
        return;
      }
      setError("Failed to delete comment.");
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
    } catch (e) {
      console.error("Edit failed:", e);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        setError("Please sign in.");
        return;
      }
      setError("Failed to edit comment.");
    }
  };

  // Local recursive component is OK in React
  const CommentItem = ({ c, depth = 0 }) => {
    const cid = String(getCid(c) ?? "");
    const isOwner =
      myUserId && String(getUserId(c) ?? "") === String(myUserId);
    const isEditing = String(editingId ?? "") === cid;

    const [localEditText, setLocalEditText] = useState(getContent(c));

    useEffect(() => {
      if (!isEditing) setLocalEditText(getContent(c));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, c]);

    const createdAt = c?.createdAt ?? c?.CreatedAt;
    const updatedAt = c?.updatedAt ?? c?.UpdatedAt;

    const wasEdited = useMemo(() => {
      if (!updatedAt || !createdAt) return false;
      return Math.abs(new Date(updatedAt) - new Date(createdAt)) > 60_000;
    }, [updatedAt, createdAt]);

    return (
      <div className="iv-comment" style={{ marginLeft: depth * 14 }}>
  <div className="iv-comment-card">
<div className="iv-comment-top">
            <div className="iv-comment-who">
  <div className="iv-comment-author">{getUserName(c) || "Unknown"}</div>
  <div className="iv-comment-time">
    {createdAt ? new Date(createdAt).toLocaleString() : ""}
    {wasEdited && <span className="iv-comment-edited"> • edited</span>}
  </div>
</div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className={
                  "btn btn-sm rounded border-0 " +
                  (getMyReaction(c) === 1
                    ? "btn-success"
                    : "btn-outline-success")
                }
                type="button"
                onClick={() => reactTo(cid, 1)}
              >
                <i className="bi bi-hand-thumbs-up me-1" />
                {getLikes(c)}
              </button>

              <button
                className={
                  "btn btn-sm rounded border-0 " +
                  (getMyReaction(c) === -1
                    ? "btn-danger"
                    : "btn-outline-danger")
                }
                type="button"
                onClick={() => reactTo(cid, -1)}
              >
                <i className="bi bi-hand-thumbs-down me-1" />
                {getDislikes(c)}
              </button>
            </div>
          </div>

          {/* Content / Editor */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={localEditText}
                onChange={(e) => setLocalEditText(e.target.value)}
                autoFocus
              />
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  type="button"
                  onClick={() => updateComment(cid, localEditText)}
                  disabled={!localEditText.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
<div className="iv-comment-text">{getContent(c)}</div>
          )}

          {/* Actions */}
<div className="iv-comment-actions">
            {!isEditing ? (
              <button className="iv-comment-reply" type="button" onClick={() => setReplyTo(cid)}>
  Reply
</button>
            ) : (
              <span />
            )}

            {isOwner && !isEditing && (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary border-0"
                  type="button"
                  title="Edit"
                  onClick={() => setEditingId(cid)}
                >
                  <i className="bi bi-pencil-square" />
                </button>

                <button
                  className="btn btn-sm btn-outline-secondary border-0"
                  type="button"
                  title="Delete"
                  onClick={() => {
                    if (window.confirm("Delete this comment?"))
                      deleteComment(cid);
                  }}
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            )}
          </div>
        </div>

        {Array.isArray(c?.replies) &&
          c.replies.map((r) => (
            <CommentItem key={String(getCid(r))} c={r} depth={depth + 1} />
          ))}
      </div>
    );
  };

  return (
    <div>
      {/* Write box */}
      <div className="border-0 rounded p-2 mb-2">
        {replyTo && (
          <div className="small text-muted mb-1">
            Replying to #{replyTo}{" "}
            <button
              className="btn btn-sm btn-link p-0"
              type="button"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}

        <textarea
          className="form-control form-control-sm border-0"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
        />

        <div className="d-flex justify-content-between align-items-center mt-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadComments}
            type="button"
          >
            Refresh
          </button>

          <button
            className="btn btn-sm btn-primary"
            type="button"
            onClick={post}
            disabled={!text.trim()}
          >
            Post
          </button>
        </div>

        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted">Loading comments...</p>
      ) : comments.length ? (
        comments.map((c) => <CommentItem key={String(getCid(c))} c={c} />)
      ) : (
        <p className="text-muted">No comments yet. Be the first!</p>
      )}
    </div>
  );
}
