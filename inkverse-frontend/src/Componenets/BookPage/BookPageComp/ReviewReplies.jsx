import { useEffect, useState } from "react";
import api from "../../../Api/api";

export default function ReviewReplies({ reviewId, show, canReply, onCountChange }) {
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState("");

  const [replies, setReplies] = useState([]);
  const [text, setText] = useState("");

  const load = async () => {
    if (!reviewId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/reviews/${reviewId}/replies`);
      setReplies(res.data || []);
      onCountChange?.((res.data || []).length);
    } catch (e) {
      console.error("Load replies failed", e);
      setErr("Failed to load replies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, reviewId]);

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    setErr("");
    try {
      await api.post(`/reviews/${reviewId}/replies`, { content: text.trim() });
      setText("");
      await load(); // refresh list + count
    } catch (e) {
      console.error("Post reply failed", e);
      setErr(
        e?.response?.status === 401
          ? "You must be logged in to reply."
          : "Failed to post reply."
      );
    } finally {
      setPosting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="mt-3 p-3 border rounded bg-light">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="fw-semibold">Replies</div>
        {loading ? <span className="text-muted small">Loading…</span> : null}
      </div>

      {err ? <div className="alert alert-danger py-2">{err}</div> : null}

      {/* list */}
      <div className="d-flex flex-column gap-2">
        {replies.length === 0 && !loading ? (
          <div className="text-muted small fst-italic">No replies yet.</div>
        ) : (
          replies.map((r) => (
            <div key={r.id ?? r.Id} className="p-2 border rounded bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div className="fw-semibold">{r.userName ?? r.UserName ?? "Unknown"}</div>
                <div className="text-muted small">
                  {formatDate(r.createdAt ?? r.CreatedAt)}
                  {(r.updatedAt ?? r.UpdatedAt) ? <span className="ms-2 badge text-bg-secondary">Edited</span> : null}
                </div>
              </div>
              <div className="mt-1">{r.content ?? r.Content ?? ""}</div>
            </div>
          ))
        )}
      </div>

      {/* add reply */}
      <div className="mt-3">
        <textarea
          className="form-control"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={canReply ? "Write a reply…" : "Login to reply…"}
          disabled={!canReply || posting}
        />

        <div className="d-flex justify-content-end mt-2">
          <button
            className="btn btn-sm btn-primary"
            type="button"
            onClick={submit}
            disabled={!canReply || posting || !text.trim()}
          >
            {posting ? "Saving…" : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}
