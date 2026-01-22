import { useEffect, useState, useCallback } from "react";
import api from "../../Api/api";

import { useContext } from "react";
import AuthContext from "../../Context/AuthProvider";

export default function ChapterComments({ chapterId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState("");
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;
  const [editingId, setEditingId] = useState(null);
  const getCid = (c) => c?.id ?? c?.Id ?? c?.ID;

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

  const CommentItem = ({ c, depth = 0 }) => {
    const cid = String(getCid(c)); // ✅ normalize
    const isOwner = myUserId && String(c.userId) === String(myUserId);
    const isEditing = String(editingId) === cid;

    const [localEditText, setLocalEditText] = useState(c.content);

    useEffect(() => {
      if (!isEditing) setLocalEditText(c.content);
    }, [c.content, isEditing]);
const wasEdited =
  !c.isDeleted &&
  c.updatedAt &&
  Math.abs(new Date(c.updatedAt) - new Date(c.createdAt)) > 60_000;

  

    return (
      <div className="mb-2" style={{ paddingLeft: depth * 12 }}>
        <div className="border-0 shadow-sm rounded p-2">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div>
              <div className="fw-semibold text-start">
                {c.userName || "Unknown"}
              </div>
              <div className="small d-flex text-muted text-start">
                {new Date(c.createdAt).toLocaleString()}
                {wasEdited && <span className=" fst-italic" style={{fontSize:"10px"}}>(edited)</span>}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className={
                  "btn btn-sm rounded border-0 " +
                  (c.myReaction === 1 ? "btn-success" : "btn-outline-success")
                }
                type="button"
                onClick={() => reactTo(cid, 1)} // ✅ use cid
              >
                <i className="bi bi-hand-thumbs-up me-1" />
                {c.likes ?? 0}
              </button>

              <button
                className={
                  "btn btn-sm rounded border-0 " +
                  (c.myReaction === -1 ? "btn-danger" : "btn-outline-danger")
                }
                type="button"
                onClick={() => reactTo(cid, -1)} // ✅ use cid
              >
                <i className="bi bi-hand-thumbs-down me-1" />
                {c.dislikes ?? 0}
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
                  onClick={() => updateComment(cid, localEditText)} // ✅ use cid
                  disabled={!localEditText.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-start">{c.content}</div>
          )}

          {/* Actions */}
          <div className="mt-2 d-flex justify-content-between align-items-center">
            {!isEditing ? (
              <button
                className="btn btn-sm btn-link p-0"
                type="button"
                onClick={() => setReplyTo(cid)} // ✅ use cid
              >
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
                  onClick={() => setEditingId(cid)} // ✅ use cid
                >
                  <i className="bi bi-pencil-square" />
                </button>

                <button
                  className="btn btn-sm btn-outline-secondary border-0"
                  type="button"
                  title="Delete"
                  onClick={() => {
                    if (confirm("Delete this comment?")) deleteComment(cid); // ✅ use cid
                  }}
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            )}
          </div>
        </div>

        {Array.isArray(c.replies) &&
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
