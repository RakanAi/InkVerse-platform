import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/api";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/admin/dashboard/stats");
      setData(res.data);
    } catch (e) {
      console.error(e);
      setErr("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-muted">Loading dashboard...</p>;
  if (err) return <p className="text-danger">{err}</p>;
  if (!data) return null;

  return (
    <div>
      <h3 className="mb-3">Dashboard</h3>

      {/* ================= Quick Actions ================= */}
      {/* Why: jump into common admin tasks without hunting in the sidebar */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="mb-0">Quick Actions</h5>
          <span className="small text-muted">Shortcuts</span>
        </div>

        {(() => {
          const QUICK_ACTIONS_STYLE = "cards";

 
          // Default: cards
          return (
            <div className="row g-3 justify-content-between">
              <QuickActionCard
                title="Create a Book"
                subtitle="Start a new story in InkVerse"
                to="/admin/books"
                variant="dark"
              />
              <QuickActionCard
                title="Manage Chapters"
                subtitle="Add/edit chapters inside a book"
                to="/admin/books"
              />
              <QuickActionCard
                title="Genres"
                subtitle="Organize discovery categories"
                to="/admin/genres"
              />
              <QuickActionCard
                title="Tags"
                subtitle="Fine-grained discovery filters"
                to="/admin/tags"
              />
              <QuickActionCard
                title="Trends"
                subtitle="Feature & promote books"
                to="/admin/trends"
              />
            </div>
          );
        })()}
      </div>

      {/* ================= Stats Cards ================= */}
      <div className="row g-3 mb-4 justify-content-between">
        <StatCard label="Books" value={data.books} />
        <StatCard label="Chapters" value={data.chapters} />
        <StatCard label="Genres" value={data.genres} />
        <StatCard label="Tags" value={data.tags} />
        <StatCard label="Trends" value={data.trends} />
      </div>

      {/* ================= Attention Needed ================= */}
      <h5 className="mb-2">Attention Needed</h5>
      <div className="row g-3 mb-4">
        <AttentionCard
          label="Books with no chapters"
          value={data.booksWithNoChapters}
        />
        <AttentionCard label="Books with no genres" value={data.booksWithNoGenres} />
        <AttentionCard label="Books with no tags" value={data.booksWithNoTags} />
      </div>

      {/* ================= Latest ================= */}
      <div className="row g-4">
        {/* Latest Books */}
        <div className="col-12 col-lg-6">
          <div className="border rounded p-3 h-100">
            <h5 className="mb-3">Latest Books</h5>

            {!data.latestBooks?.length ? (
              <div className="text-muted">No books yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th className="text-end">Words</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.latestBooks.map((b) => (
                      <tr key={b.id}>
                        <td className="fw-semibold">{b.title}</td>
                        <td className="text-muted">{b.status}</td>
                        <td className="text-end">{b.wordCount ?? 0}</td>
                        <td className="text-end">
                          <Link className="btn btn-outline-dark btn-sm" to={`/admin/books/${b.id}/edit`}>
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Latest Chapters */}
        <div className="col-12 col-lg-6">
          <div className="border rounded p-3 h-100">
            <h5 className="mb-3">Latest Chapters</h5>

            {!data.latestChapters?.length ? (
              <div className="text-muted">No chapters yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th className="text-center">#</th>
                      <th>Title</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.latestChapters.map((c) => (
                      <tr key={c.id}>
                        <td className="text-muted">{c.bookTitle}</td>
                        <td className="text-center fw-semibold">{c.number}</td>
                        <td className="fw-semibold">{c.title}</td>
                        <td className="text-end">
                          <Link className="btn btn-outline-dark btn-sm" to={`/admin/chapters/${c.id}/edit`}>
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, subtitle, to, variant }) {
  const classes =
    variant === "dark"
      ? "border rounded p-3 h-100 bg-dark text-white"
      : "border rounded p-3 h-100 bg-light";

  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div className={classes}>
        <div className="d-flex flex-column h-100">
          <div className="fw-semibold">{title}</div>
          <div className={variant === "dark" ? "text-white-50 small" : "text-muted small"}>
            {subtitle}
          </div>

          <div className="mt-3">
            <Link
              className={variant === "dark" ? "btn btn-light btn-sm" : "btn btn-dark btn-sm"}
              to={to}
            >
              Open
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="col-6 col-md-4 col-lg-2">
      <div className="border rounded p-3 h-100">
        <div className="text-muted small">{label}</div>
        <div className="fs-4 fw-semibold">{value}</div>
      </div>
    </div>
  );
}

function AttentionCard({ label, value }) {
  const isBad = (value ?? 0) > 0;
  return (
    <div className="col-12 col-md-4">
      <div
        className={`border rounded p-3 h-100 ${
          isBad ? "border-danger text-danger" : "border-success text-success"
        }`}
      >
        <div className="fw-semibold">{label}</div>
        <div className="fs-4">{value}</div>
      </div>
    </div>
  );
}
