import React, { useMemo } from "react";
import "./BookMetaBox.css";
import { useNavigate } from "react-router-dom";
import { BiLinkExternal } from "react-icons/bi";

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
};

const toArray = (v) => (Array.isArray(v) ? v : []);

export default function BookMetaBox({ book }) {
  const nav = useNavigate();

  const status = pick(book, "status", "Status") ?? "-";
  const verseType = pick(book, "verseType", "VerseType") ?? "-";
  const originType = pick(book, "originType", "OriginType") ?? "-";

  // ✅ source for translation (optional)
  const sourceUrlRaw = pick(book, "sourceUrl", "SourceUrl") ?? "";
  const sourceUrl = String(sourceUrlRaw || "").trim();

  const isTranslation = String(originType).toLowerCase() === "translation";
  const showSource = isTranslation && !!sourceUrl;

  const genres = useMemo(() => {
    return (
      toArray(pick(book, "genres", "Genres")) ||
      toArray(pick(book, "genreNames", "GenreNames")) ||
      []
    );
  }, [book]);

  const tags = useMemo(() => {
    return (
      toArray(pick(book, "tags", "Tags")) ||
      toArray(pick(book, "tagNames", "TagNames")) ||
      []
    );
  }, [book]);

  const goBrowse = (paramsObj) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(paramsObj)) {
      if (v === undefined || v === null || v === "") continue;
      p.set(k, v);
    }
    nav(`/browser?${p.toString()}`);
  };

  const openSource = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sourceUrl) return;

    // If user saved without https://, try to fix it
    const safe =
      /^https?:\/\//i.test(sourceUrl) ? sourceUrl : `https://${sourceUrl}`;

    window.open(safe, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="iv-meta card p-3 border-3 mt-3">
      <div className="card-body">
        <div className="d-flex gap-3 align-items-center justify-content-between">
          <div className="iv-meta-row">
            <div className="iv-meta-k">Status</div>
            <div className="iv-meta-v">{status}</div>
          </div>

          <div className="iv-meta-row border-end border-start">
            <div className="iv-meta-k">Verse</div>
            <div className="iv-meta-v">{verseType}</div>
          </div>

          <div className="iv-meta-row">
            <div className="iv-meta-k">Origin</div>

            <div className="iv-meta-v align-items-center gap-2">
              <span>{originType}</span>

              {/* ✅ show only if Translation + source exists */}
              {showSource ? (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-warning py-0 px-2"
                  onClick={openSource}
                  title="Open source"
                  aria-label="Open source"
                  style={{ lineHeight: 1.2 }}
                >
                  <BiLinkExternal size={18} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <hr className="my-3" />

        <div className="row g-3 genn">
          <div className="col-12">
            <div className="iv-meta-k mb-2 text-start">
              <div className="d-flex align-items-center">
                <p className="borderStart mb-0"></p> Genres
              </div>
            </div>

            {genres.length ? (
              <div className="d-flex flex-wrap gap-2">
                {genres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className="btn btn-outline-primary p-2 rounded border "
                    onClick={() => goBrowse({ genre: g })}
                    title={`Browse genre: ${g}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted small">No genres</div>
            )}
          </div>

          <div className="col-12 col-lg-6 tagg">
            <div className="iv-meta-k mb-2 text-start">
              <div className="d-flex align-items-center">
                <p className="borderStart mb-0"></p> Tags
              </div>
            </div>

            {tags.length ? (
              <div className="d-flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="btn btn-outline-primary p-2 rounded border"
                    style={{ minWidth: "60px" }}
                    onClick={() => goBrowse({ tag: t })}
                    title={`Browse tag: ${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted small">No tags</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
