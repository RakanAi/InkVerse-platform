import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../Api/api";

export default function AdminChaptersPage() {
  const { bookId } = useParams();
  const bId = Number(bookId);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [importing, setImporting] = useState(false);

  const normalizeImportedChapter = (ch) => {
    const number = Number(ch.number ?? ch.chapterNumber ?? 0) || 0;
    const title = (ch.title ?? "").trim();
    const content = (ch.content ?? "").trim();
    return { number, title, content };
  };

  const getChapterNumber = (c) =>
    Number(c?.chapterNumber ?? c?.ChapterNumber ?? 0) || 0;

  const getChapterUrl = (c) => String(c?.url ?? c?.Url ?? "").trim();

  const importChaptersFile = async (file) => {
    if (!file) return;

    try {
      setErr("");
      setImporting(true);

      // Make sure we have latest chapters before checking duplicates
      // (optional but recommended)
      let currentItems = items;
      if (!Array.isArray(currentItems) || currentItems.length === 0) {
        const chapRes = await api.get(`/admin/books/${bId}/chapters`);
        currentItems = Array.isArray(chapRes.data) ? chapRes.data : [];
      }

      // Build a Set of existing chapter numbers in DB
      const existingNums = new Set(
        currentItems.map(getChapterNumber).filter((n) => n > 0),
      );

      const existingUrls = new Set(
        currentItems.map(getChapterUrl).filter((u) => u),
      );

      const text = await file.text();
      const data = JSON.parse(text);

      const chapters = Array.isArray(data?.chapters) ? data.chapters : [];
      if (!chapters.length) {
        setErr("No chapters found in this JSON file.");
        return;
      }

      // sort by number
      const sorted = chapters
        .map(normalizeImportedChapter)
        .filter((c) => c.title && c.content)
        .sort((a, b) => (a.number || 0) - (b.number || 0));

      if (!sorted.length) {
        setErr("Chapters exist, but titles/content are empty after parsing.");
        return;
      }

      // ✅ Only keep chapters that are NOT already in DB
      const missingOnly = sorted.filter((ch) => {
        const n = Number(ch.number) || 0;
        const u = (ch.url || "").trim();

        const dupByNum = n > 0 && existingNums.has(n);
        const dupByUrl = u && existingUrls.has(u);

        return !dupByNum && !dupByUrl;
      });

      if (!missingOnly.length) {
        alert("All chapters in this file already exist ✅ (Nothing to import)");
        return;
      }

      let created = 0;
      let skipped = sorted.length - missingOnly.length;

      for (const ch of missingOnly) {
        if (ch.number) existingNums.add(ch.number);
        if (ch.url) existingUrls.add(ch.url);
        const payload = {
          title: ch.title,
          content: ch.content,
          chapterNumber: ch.number || 1,
          arcId: null,
        };

        try {
          await api.post(`/admin/books/${bId}/chapters`, payload);
          created++;
        } catch (e) {
          // If backend has unique constraint and returns conflict, ignore it
          const status = e?.response?.status;
          if (status === 409) {
            skipped++;
            continue;
          }
          throw e; // real error
        }
      }

      await load();
      alert(
        `Import done ✅ Added: ${created} | Skipped (already existed): ${skipped}`,
      );
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const groups = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return [];

    const hasRealArcs = list.some((c) => c.arcId != null);

    if (hasRealArcs) {
      const map = new Map();
      for (const c of list) {
        const rawName = c.arcName ?? c.ArcName;
        const cleanedName =
          rawName && String(rawName).trim().toLowerCase() !== "null"
            ? String(rawName).trim()
            : "";

        const key = cleanedName || "No Arc";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(c);
      }

      return Array.from(map.entries()).map(([name, chapters]) => ({
        name,
        chapters: chapters
          .slice()
          .sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0)),
      }));
    }

    // no arcs at all -> virtual ranges
    const maxNum = Math.max(...list.map((c) => Number(c.chapterNumber) || 0));
    const step = maxNum > 300 ? 250 : 100;

    const map = new Map();
    for (const c of list) {
      const n = Number(c.chapterNumber) || 0;
      const start = Math.floor((Math.max(n, 1) - 1) / step) * step + 1;
      const end = start + step - 1;
      const key = `${start}–${end}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }

    const parseStart = (label) => Number(label.split("–")[0]) || 0;

    return Array.from(map.entries())
      .sort((a, b) => parseStart(a[0]) - parseStart(b[0]))
      .map(([name, chapters]) => ({
        name,
        chapters: chapters
          .slice()
          .sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0)),
      }));
  }, [items]);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const [chapRes, bookRes] = await Promise.all([
        api.get(`/admin/books/${bId}/chapters`),
        api.get(`/books/${bId}`),
      ]);

      setItems(Array.isArray(chapRes.data) ? chapRes.data : []);
      setBookTitle(bookRes.data?.title ?? "");
    } catch (e) {
      console.error(e);
      setErr("Failed to load chapters.");
      setItems([]);
      setBookTitle("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bId]);

  const remove = async (chapterId) => {
    if (!window.confirm("Delete this chapter?")) return;
    try {
      await api.delete(`/admin/books/${bId}/chapters/${chapterId}`);
      await load();
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  };

  return (
    <div className="border rounded p-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h4 className="mb-0">
          Admin: BookChapters — {bookTitle ? bookTitle : `Book #${bId}`}
        </h4>

        <div className="d-flex gap-2">
          {/* Import JSON */}
          <label className="btn btn-outline-success mb-0">
            {importing ? "Importing..." : "Import Chapters (JSON)"}
            <input
              type="file"
              accept="application/json"
              hidden
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                // allow selecting same file again
                e.target.value = "";
                importChaptersFile(file);
              }}
            />
          </label>

          {/* Manual create */}
          <Link
            className="btn btn-primary"
            to={`/admin/books/${bId}/chapters/new`}
          >
            + New Chapter
          </Link>
        </div>
      </div>

      {loading ? <p className="text-muted mt-3">Loading...</p> : null}
      {err ? <p className="text-danger mt-3">{err}</p> : null}

      {!loading && !err && (
        <>
          {!groups.length ? (
            <p className="text-muted mt-3">No chapters yet.</p>
          ) : (
            groups.map((g) => (
              <div key={g.name} className="mt-3">
                <div className="fw-semibold text-start mb-2 ps-2 border-bottm">
                  ArkName: {g.name}
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>#</th>
                        <th>Title</th>
                        <th style={{ width: 220 }} className="text-end">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.chapters.map((c) => (
                        <tr key={c.id}>
                          <td>{c.chapterNumber}</td>
                          <td
                            className="text-truncate"
                            style={{ maxWidth: 520 }}
                            title={c.title}
                          >
                            {c.title}
                          </td>
                          <td className="text-end">
                            <Link
                              className="btn btn-sm btn-outline-primary me-2"
                              to={`/admin/books/${bId}/chapters/${c.id}`}
                            >
                              Edit
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => remove(c.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
