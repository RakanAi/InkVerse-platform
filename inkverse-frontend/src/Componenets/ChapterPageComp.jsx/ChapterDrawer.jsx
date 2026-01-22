import React, { useMemo, useState } from "react";

/**
 * Props:
 * - chapters: array of { id, title, chapterNumber }
 * - currentChapterId: string|number
 * - onSelect: (chapterId) => void
 * - canvasId?: string (optional) used for unique offcanvas id
 */
export default function ChapterDrawer({
  chapters = [],
  currentChapterId,
  onSelect,
  canvasId = "chaptersOffcanvas",
}) {
  const [q, setQ] = useState("");

  const sorted = useMemo(() => {
    return [...chapters].sort(
      (a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0)
    );
  }, [chapters]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sorted;

    return sorted.filter((c) => {
      const t = (c.title ?? "").toLowerCase();
      const n = String(c.chapterNumber ?? "");
      return t.includes(query) || n.includes(query);
    });
  }, [sorted, q]);

  return (
    <>
      {/* Trigger Button */}
      <button
        className="btn btn-sm btn-outline-secondary"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target={`#${canvasId}`}
        aria-controls={canvasId}
      >
        Chapters
      </button>

      {/* Offcanvas */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id={canvasId}
        aria-labelledby={`${canvasId}Label`}
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id={`${canvasId}Label`}>
            Chapters
          </h5>

          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>

        <div className="offcanvas-body p-2">
          {/* Search */}
          <input
            className="form-control form-control-sm mb-2"
            placeholder="Search title or number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="list-group">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className={
                  "list-group-item list-group-item-action d-flex justify-content-between align-items-center " +
                  (String(c.id) === String(currentChapterId) ? "active" : "")
                }
                data-bs-dismiss="offcanvas"
                onClick={() => onSelect?.(c.id)}
              >
                <span className="me-2 text-truncate" style={{ maxWidth: 260 }}>
                  {c.title || "Untitled"}
                </span>

                <span className="badge bg-secondary">
                  #{c.chapterNumber ?? "?"}
                </span>
              </button>
            ))}
          </div>

          {!filtered.length && (
            <p className="text-muted mt-3 mb-0">No matching chapters.</p>
          )}
        </div>
      </div>
    </>
  );
}
