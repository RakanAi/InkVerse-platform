import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../Api/api";
import "./TopVersesBooks.css";
import { absUrl } from "../../../Utils/absUrl";

const FALLBACK_COVER = "/src/assets/BackGround_04.png";

function ListCard({ title, items, loading }) {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div className="iv-top-card ">
        <div className="iv-top-head">
          <h5 className="m-0 text-start mb-2">{title}</h5>
        </div>

        {loading ? (
          <div className="text-muted small p-2">Loading…</div>
        ) : !items?.length ? (
          <div className="text-muted small p-2">No books yet.</div>
        ) : (
          <ul className="iv-top-list">
            {items.map((b, idx) => (
              <li key={b.id} className="iv-top-item">
                <Link to={`/book/${b.id}`} className="iv-top-cover">
                  <img
                    src={absUrl(b.coverImageUrl) || b.coverImageUrl || FALLBACK_COVER}
                    alt={b.title}
                    loading="lazy"
                  />
                </Link>

                <div className="iv-top-meta">
                  <div className="iv-top-row mb-4 pb-3">
                    <span className="iv-top-rank">#{idx + 1}</span>
                    <Link
                      to={`/book/${b.id}`}
                      className="iv-top-title"
                      title={b.title}
                    >
                      {b.title}
                    </Link>
                  </div>

                  <div className="iv-top-sub text-start">
                    {b.authorName || "—"}
                  </div>

                  <div className="iv-top-sub text-start off-3">
                    ⭐{" "}
                    {typeof b.averageRating === "number"
                      ? b.averageRating.toFixed(1)
                      : "N/A"}
                    <span className="ms-2 text-muted">•</span>
                    <span className="ms-2 text-muted">
                      {b.totalViews ?? 0} views
                    </span>{" "}
                    <br />
                  </div>
                </div>
                <span className="iv-top-sub text-muted">{b.status}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="text-end mt-2">
          <Link className="iv-top-link" to="/Browser">
            Explore more →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TopVersesBooks() {
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState([]);
  const [fanfic, setFanfic] = useState([]);
  const [au, setAu] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const [o, f, a] = await Promise.all([
          api.get("/books/top-by-verse?verseType=Original&take=5"),
          api.get("/books/top-by-verse?verseType=Fanfic&take=5"),
          api.get("/books/top-by-verse?verseType=AU&take=5"),
        ]);

        if (!alive) return;
        setOriginal(o.data || []);
        setFanfic(f.data || []);
        setAu(a.data || []);
      } catch (e) {
        console.error("Top lists failed", e);
        if (!alive) return;
        setOriginal([]);
        setFanfic([]);
        setAu([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="iv-container" style={{ marginTop: 18 }}>
      <div className="d-flex align-items-center mb-2">
        <h2 className="borderStart mt-2"></h2>

        <h4 className="text-dark m-0">Top Books</h4>
      </div>

      <div className="row g-3">
        <ListCard title="Original" items={original} loading={loading} />
        <ListCard title="AU" items={au} loading={loading} />
        <ListCard title="Fan-Fiction" items={fanfic} loading={loading} />
      </div>
    </section>
  );
}
