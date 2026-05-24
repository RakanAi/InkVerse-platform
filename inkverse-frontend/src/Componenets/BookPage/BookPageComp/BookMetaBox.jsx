import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    const safe = /^https?:\/\//i.test(sourceUrl)
      ? sourceUrl
      : `https://${sourceUrl}`;

    window.open(safe, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="iv-meta mt-4">
      <div className="iv-meta-top">
        <div className="iv-meta-row">
          <div className="iv-meta-k">{t("bookPage.meta.status")}</div>
          <div className="iv-meta-v">{status}</div>
        </div>

        <div className="iv-meta-row">
          <div className="iv-meta-k">{t("bookPage.meta.verse")}</div>
          <div className="iv-meta-v">{verseType}</div>
        </div>

        <div className="iv-meta-row">
          <div className="iv-meta-k">{t("bookPage.meta.origin")}</div>
          <div className="iv-meta-v iv-meta-v--origin">
            <span>{originType}</span>
            {showSource ? (
              <button
                type="button"
                className="iv-meta-source"
                onClick={openSource}
                title={t("bookPage.meta.openSource")}
                aria-label={t("bookPage.meta.openSource")}
              >
                <BiLinkExternal size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="iv-meta-groups">
        <div className="iv-meta-group">
          <div className="iv-meta-k mb-2 text-start">{t("bookPage.meta.genres")}</div>

          {genres.length ? (
            <div className="iv-meta-links">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  className="iv-meta-link"
                  onClick={() => goBrowse({ genre: g })}
                  title={t("bookPage.meta.browseGenre", { genre: g })}
                >
                  #{g}
                </button>
              ))}
            </div>
          ) : (
            <div className="iv-meta-empty">{t("bookPage.meta.noGenres")}</div>
          )}
        </div>

        <div className="iv-meta-group">
          <div className="iv-meta-k mb-2 text-start">{t("bookPage.meta.tags")}</div>

          {tags.length ? (
            <div className="iv-meta-links">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="iv-meta-link"
                  onClick={() => goBrowse({ tag })}
                  title={t("bookPage.meta.browseTag", { tag })}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : (
            <div className="iv-meta-empty">{t("bookPage.meta.noTags")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
