import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/api";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import PageHeader from "../../Shared/ui/PageHeader";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";

const QUICK_ACTIONS = [
  {
    title: "Create Or Edit Books",
    subtitle: "Manage metadata, covers, and publishing state.",
    to: "/admin/books",
  },
  {
    title: "Curate Trends",
    subtitle: "Promote books and update spotlight trends.",
    to: "/admin/trends",
  },
  {
    title: "Manage Users",
    subtitle: "Moderate accounts and apply restrictions.",
    to: "/admin/users",
  },
];

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

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Books", value: data.books },
      { label: "Chapters", value: data.chapters },
      { label: "Genres", value: data.genres },
      { label: "Tags", value: data.tags },
      { label: "Trends", value: data.trends },
    ];
  }, [data]);

  if (loading) return <LoadingState text="Loading dashboard..." />;
  if (err) return <ErrorState title="Dashboard unavailable" subtitle={err} onRetry={load} />;
  if (!data) return <EmptyState title="No dashboard data" subtitle="Try again in a moment." />;

  return (
    <div className="admin-dashboard-page">
      <PageHeader
        title="Operations Snapshot"
        subtitle="Overview of catalog health and high-priority tasks."
      />

      <section className="admin-section mb-4">
        <div className="admin-section-head">
          <h3 className="admin-section-title">Quick Actions</h3>
        </div>

        <div className="admin-actions-grid">
          {QUICK_ACTIONS.map((action) => (
            <Surface key={action.title} className="admin-action-card">
              <h4 className="admin-action-title">{action.title}</h4>
              <p className="admin-action-subtitle mb-0">{action.subtitle}</p>
              <div className="mt-3">
                <Link to={action.to} className="text-decoration-none">
                  <Button variant="primary">Open</Button>
                </Link>
              </div>
            </Surface>
          ))}
        </div>
      </section>

      <section className="admin-section mb-4">
        <div className="admin-section-head">
          <h3 className="admin-section-title">System Volume</h3>
        </div>

        <div className="admin-stats-grid">
          {stats.map((s) => (
            <Surface key={s.label} className="admin-stat-card">
              <p className="admin-stat-label mb-1">{s.label}</p>
              <p className="admin-stat-value mb-0">{s.value}</p>
            </Surface>
          ))}
        </div>
      </section>

      <section className="admin-section mb-4">
        <div className="admin-section-head">
          <h3 className="admin-section-title">Attention Needed</h3>
        </div>

        <div className="admin-attention-grid">
          <AttentionCard label="Books Missing Chapters" value={data.booksWithNoChapters} />
          <AttentionCard label="Books Missing Genres" value={data.booksWithNoGenres} />
          <AttentionCard label="Books Missing Tags" value={data.booksWithNoTags} />
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-latest-grid">
          <Surface className="admin-table-card">
            <div className="admin-section-head mb-3">
              <h3 className="admin-section-title">Latest Books</h3>
            </div>

            {!data.latestBooks?.length ? (
              <EmptyState title="No books yet" subtitle="New books will appear here." />
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0 admin-table-modern">
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
                          <Link to={`/admin/books/${b.id}`} className="text-decoration-none">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>

          <Surface className="admin-table-card">
            <div className="admin-section-head mb-3">
              <h3 className="admin-section-title">Latest Chapters</h3>
            </div>

            {!data.latestChapters?.length ? (
              <EmptyState title="No chapters yet" subtitle="New chapters will appear here." />
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0 admin-table-modern">
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
                        <td className="text-center fw-semibold">{c.chapterNumber}</td>
                        <td className="fw-semibold">{c.title}</td>
                        <td className="text-end">
                          <Link
                            to={`/admin/books/${c.bookId}/chapters/${c.id}`}
                            className="text-decoration-none"
                          >
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        </div>
      </section>
    </div>
  );
}

function AttentionCard({ label, value }) {
  const count = Number(value ?? 0);
  const tone = count > 0 ? "warn" : "ok";

  return (
    <Surface className={`admin-attention-card ${tone}`}>
      <p className="admin-attention-label mb-1">{label}</p>
      <p className="admin-attention-value mb-0">{count}</p>
    </Surface>
  );
}
