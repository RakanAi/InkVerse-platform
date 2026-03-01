import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../Api/api";
import "./TopVersesBooks.css";

import PageHeader from "@/Shared/ui/PageHeader";
import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";

import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";

import {
  TOPBOOKS_LABELS,
  TOPBOOKS_TAKE,
  TOPBOOKS_VERSE_TYPES,
} from "@/features/home/topbooks/topbooks.presets";
import { buildTopByVerseEndpoint } from "@/features/home/topbooks/utils/buildTopByVerseEndpoint";
import { normalizeTopBooksResponse } from "@/features/home/topbooks/utils/normalizeTopBooksResponse";

function ListCard({ title, items, loading }) {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div className="iv-surface">
        <div className="iv-top-head">
          <h5 className="m-0 text-start mb-2">{title}</h5>
        </div>

        {loading ? (
          <div className="p-2">
            <LoadingState title="Loading…" />
          </div>
        ) : !items?.length ? (
          <div className="p-2">
            <EmptyState title="No books yet." />
          </div>
        ) : (
          <ul className="iv-top-list">
            {items.map((b, idx) => {
              const id = b.id ?? b.Id;
              const titleText = b.title ?? b.Title ?? "Untitled";

              return (
                <li key={id ?? idx} className="iv-top-item">
                  <Link to={`/book/${id}`} className="iv-top-cover">
                    <BookCover
                      variant="tile"
                      src={getBookCoverSrc(b)}
                      alt={titleText}
                    />
                  </Link>

                  <div className="iv-top-meta">
                    <div className="iv-top-row mb-4 pb-3">
                      <span className="iv-top-rank">#{idx + 1}</span>
                      <Link
                        to={`/book/${id}`}
                        className="iv-top-title"
                        title={titleText}
                      >
                        {titleText}
                      </Link>
                    </div>

                    <div className="iv-top-sub text-start">
                      {b.authorName ?? b.AuthorName ?? "—"}
                    </div>

                    <div className="iv-top-sub text-start off-3">
                      ⭐{" "}
                      {typeof b.averageRating === "number"
                        ? b.averageRating.toFixed(1)
                        : "N/A"}
                      <span className="ms-2 text-muted">•</span>
                      <span className="ms-2 text-muted">
                        {(b.totalViews ?? b.TotalViews ?? 0)} views
                      </span>
                      <br />
                    </div>
                  </div>

                  <span className="iv-top-sub text-muted">
                    {b.status ?? b.Status ?? ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="text-end mt-2">
          <Link className="iv-top-link" to="/Browser">
            {TOPBOOKS_LABELS.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TopVersesBooks() {
  const [loading, setLoading] = useState(true);

  // Keep state shape stable & scalable
  const [lists, setLists] = useState(() => ({
    Original: [],
    AU: [],
    Fanfic: [],
  }));

  const endpoints = useMemo(() => {
    return TOPBOOKS_VERSE_TYPES.map((v) => ({
      ...v,
      endpoint: buildTopByVerseEndpoint({ verseType: v.key, take: TOPBOOKS_TAKE }),
    }));
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const results = await Promise.all(endpoints.map((x) => api.get(x.endpoint)));

        if (!alive) return;

        const next = { Original: [], AU: [], Fanfic: [] };

        endpoints.forEach((x, i) => {
          next[x.key] = normalizeTopBooksResponse(results[i]?.data);
        });

        setLists(next);
      } catch (e) {
        console.error("Top lists failed", e);
        if (!alive) return;
        setLists({ Original: [], AU: [], Fanfic: [] });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [endpoints]);

  return (
    <section className="iv-container" style={{ marginTop: 18 }}>
      <div className="d-flex align-items-center mb-2">
        <span className="borderStart mt-2" />
        <div className="" style={{ flex: 1 }}>
          <PageHeader title={TOPBOOKS_LABELS.title} subtitle={TOPBOOKS_LABELS.subtitle} />
        </div>
      </div>

      <div className="row g-3">
        {TOPBOOKS_VERSE_TYPES.map((v) => (
          <ListCard key={v.key} title={v.title} items={lists[v.key]} loading={loading} />
        ))}
      </div>
    </section>
  );
}