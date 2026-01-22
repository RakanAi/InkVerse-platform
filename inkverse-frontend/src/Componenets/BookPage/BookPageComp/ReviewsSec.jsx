import { useMemo, useState } from "react";
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
  const [sortMode, setSortMode] = useState("newest"); // "newest" | "oldest"

  const sorted = useMemo(() => {
    const list = Array.isArray(reviews) ? [...reviews] : [];
    list.sort((a, b) => {
      const aT = toMs(pick(a, "createdAt", "CreatedAt")) || toMs(pick(a, "updatedAt", "UpdatedAt"));
      const bT = toMs(pick(b, "createdAt", "CreatedAt")) || toMs(pick(b, "updatedAt", "UpdatedAt"));
      return sortMode === "newest" ? bT - aT : aT - bT;
    });
    return list;
  }, [reviews, sortMode]);

  if (loading) return <div className="text-muted">Loading reviews...</div>;

  return (
    <div className="row mx-0 my-4">
      <div className="d-flex align-items-center">
        <div className="fw-bold fs-5 text-start d-flex align-items-center">
          <p className="borderStart my-0"></p>Reviews
          
          </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary text-start"
          onClick={() => setSortMode((m) => (m === "newest" ? "oldest" : "newest"))}
          title="Toggle sort order"
        >
          {sortMode === "newest" ? "Newest" : "Oldest"}
        </button>
      </div>
      <div className="p-3 d-flex flex-column gap-3">
        {sorted.length === 0 ? (
          <div className="text-muted">No reviews yet. Be the first!</div>
        ) : (
          sorted.map((r) => (
            <ReviewCard key={r.id ?? r.Id} review={r} onRefresh={onRefresh} />
          ))
        )}
      </div>
    </div>
  );
}
