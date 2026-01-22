import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";
import { absUrl } from "../../Utils/absUrl";

export default function AdminBookEditor({ mode }) {
  const nav = useNavigate();
  const { id } = useParams();

  const isEdit = mode === "edit";
  const bookId = isEdit ? Number(id) : null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [allGenres, setAllGenres] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allTrends, setAllTrends] = useState([]);

  const [uploading, setUploading] = useState(false);

  const uploadCover = async (file) => {
    if (!file) return;

    try {
      setErr("");
      setUploading(true);

      const fd = new FormData();
      fd.append("File", file); // ✅ must match UploadImageDto.File

      // ✅ correct backend endpoint: POST /api/uploads/books/admin
      const res = await api.post("/uploads/books/admin", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url ?? res.data?.Url ?? "";
      if (!url) {
        setErr("Upload succeeded but no URL returned.");
        return;
      }

      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data ||
          e?.response?.data?.message ||
          "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    coverImageUrl: "",
    verseType: "Original",
    originType: "PlatformOriginal",
    status: "Ongoing",
    genreIds: [],
    tagIds: [],
    trendIds: [],
    sourceUrl: "",
  });

  const toggleId = (arr, x) => {
    const safe = Array.isArray(arr) ? arr : [];
    return safe.includes(x) ? safe.filter((i) => i !== x) : [...safe, x];
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setErr("");

      const [gRes, tRes, trRes] = await Promise.all([
        api.get("/admin/genres", { params: { includeInactive: true } }),
        api.get("/admin/tags", { params: { includeInactive: true } }),
        api.get("/admin/trends", { params: { includeInactive: true } }),
      ]);

      setAllGenres(gRes.data ?? []);
      setAllTags(tRes.data ?? []);
      setAllTrends(trRes.data ?? []);

      if (isEdit && bookId) {
        const bookRes = await api.get(`/books/${bookId}`);
        const b = bookRes.data;

        setForm((prev) => ({
          ...prev,
          title: b.title ?? "",
          description: b.description ?? "",
          coverImageUrl: b.coverImageUrl ?? "",

          verseType: b.verseType ?? b.VerseType ?? "Original",
          originType: b.originType ?? b.OriginType ?? "PlatformOriginal",
          status: b.status ?? b.Status ?? "Ongoing",

          genreIds: Array.isArray(b.genreIds) ? b.genreIds : [],
          tagIds: Array.isArray(b.tagIds) ? b.tagIds : [],
          trendIds: [],
          sourceUrl: b.sourceUrl ?? b.SourceUrl ?? "",
        }));

        // Optional: if you already have trend book link listing:
        // We'll load trendIds by checking each trend's linked books (OK for small data).
        const trendIds = [];
        for (const tr of trRes.data ?? []) {
          const idsRes = await api.get(`/admin/trends/${tr.id}/books`);
          const ids = idsRes.data ?? [];
          if (ids.map(String).includes(String(bookId))) trendIds.push(tr.id);
        }
        setForm((prev) => ({ ...prev, trendIds }));
      }
    } catch (e) {
      console.error(e);
      setErr("Failed to load editor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [bookId]);

  const save = async () => {
    try {
      setErr("");

      // Basic validation
      if (!form.title.trim()) {
        setErr("Title is required.");
        return;
      }

      // Create/Update book
      if (!isEdit) {
        const payload = {
          title: form.title,
          description: form.description,
          coverImageUrl: form.coverImageUrl,
          verseType: form.verseType,
          originType: form.originType,
          status: form.status,
          sourceUrl: form.originType === "Translation" ? form.sourceUrl : null, // ✅

          genreIds: form.genreIds,
          tagIds: form.tagIds,
        };
        const res = await api.post("/books", payload);
        const newId = res.data?.id ?? res.data?.Id;
        if (newId) {
          // Sync trends for the new book
          for (const trId of form.trendIds) {
            await api.post(`/admin/trends/${trId}/books`, { bookId: newId });
          }
        }
      } else {
        const payload = {
          title: form.title,
          description: form.description,
          coverImageUrl: form.coverImageUrl,
          verseType: form.verseType,
          originType: form.originType,
          status: form.status,
          genreIds: form.genreIds,
          tagIds: form.tagIds,
        };
        await api.put(`/books/${bookId}`, payload);

        // Sync trends: compute adds/removes
        // (we’ll re-check current links quickly)
        const current = [];
        for (const tr of allTrends) {
          const idsRes = await api.get(`/admin/trends/${tr.id}/books`);
          const ids = idsRes.data ?? [];
          if (ids.map(String).includes(String(bookId))) current.push(tr.id);
        }

        const toAdd = form.trendIds.filter((x) => !current.includes(x));
        const toRemove = current.filter((x) => !form.trendIds.includes(x));

        for (const trId of toAdd) {
          await api.post(`/admin/trends/${trId}/books`, { bookId });
        }
        for (const trId of toRemove) {
          await api.delete(`/admin/trends/${trId}/books/${bookId}`);
        }
      }

      nav("/admin/books");
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Save failed.");
    }
  };

  if (loading)
    return <div className="border rounded p-3 text-muted">Loading...</div>;

  return (
    <div className="border rounded p-3">
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">{isEdit ? "Edit Book" : "Create Book"}</h4>
        <button
          className="btn btn-outline-secondary"
          onClick={() => nav("/admin/books")}
        >
          Back
        </button>
      </div>

      {err ? <div className="alert alert-danger mt-3">{err}</div> : null}

      <div className="row g-3 mt-1">
        <div className="col-12">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="Ongoing">Ongoing</option>
            <option value="Paused">Paused</option>
            <option value="Dropped">Dropped</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* <div className="col-12 col-md-6">
          <label className="form-label">WordCount</label>
          <input
            type="number"
            className="form-control"
            value={form.wordCount}
            onChange={(e) =>
              setForm((f) => ({ ...f, wordCount: e.target.value }))
            }
          />
        </div> */}

        <div className="col-12">
          <label className="form-label">Cover Image</label>

          <div className="d-flex gap-2 flex-wrap align-items-center">
            <input
              type="file"
              accept="image/*"
              className="form-control"
              disabled={uploading}
              onChange={(e) => uploadCover(e.target.files?.[0])}
              style={{ maxWidth: 420 }}
            />

            {uploading ? <span className="text-muted">Uploading…</span> : null}

            {form.coverImageUrl ? (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setForm((f) => ({ ...f, coverImageUrl: "" }))}
              >
                Remove
              </button>
            ) : null}
          </div>

          {/* Keep manual input as fallback */}
          <div className="mt-2">
            <label className="form-label small text-muted">
              CoverImageUrl (fallback/manual)
            </label>
            <input
              className="form-control"
              value={form.coverImageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, coverImageUrl: e.target.value }))
              }
            />
          </div>

          {/* Preview */}
          <div className="mt-3">
            {form.coverImageUrl ? (
              <img
                src={absUrl(form.coverImageUrl)}
                alt="cover preview"
                style={{
                  width: 140,
                  height: 190,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,.1)",
                }}
              />
            ) : (
              <div className="text-muted small">No cover uploaded yet.</div>
            )}
          </div>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label">Verse Type</label>
          <select
            className="form-select"
            value={form.verseType}
            onChange={(e) =>
              setForm((f) => ({ ...f, verseType: e.target.value }))
            }
          >
            <option value="Original">Original</option>
            <option value="Fanfic">Fanfic</option>
            <option value="AU">AU</option>
          </select>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label">Origin Type</label>
          <select
            className="form-select"
            value={form.originType}
            onChange={(e) =>
              setForm((f) => ({ ...f, originType: e.target.value }))
            }
          >
            <option value="PlatformOriginal">PlatformOriginal</option>
            <option value="Translation">Translation</option>
          </select>
        </div>

        {form.originType === "Translation" && (
          <div className="col-12">
            <label className="form-label">
              Source (optional){" "}
              <span className="text-muted small">(original link)</span>
            </label>
            <input
              className="form-control"
              placeholder="https://example.com/novel/..."
              value={form.sourceUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, sourceUrl: e.target.value }))
              }
            />
          </div>
        )}

        <div className="col-12 col-lg-4">
          <div className="border rounded p-2">
            <div className="fw-semibold mb-2">Genres</div>
            <div
              className="d-flex flex-column gap-1"
              style={{ maxHeight: 240, overflow: "auto" }}
            >
              {allGenres.map((g) => (
                <label key={g.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.genreIds.includes(g.id)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        genreIds: toggleId(f.genreIds, g.id),
                      }))
                    }
                  />
                  <span className="form-check-label">{g.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="border rounded p-2">
            <div className="fw-semibold mb-2">Tags</div>
            <div
              className="d-flex flex-column gap-1"
              style={{ maxHeight: 240, overflow: "auto" }}
            >
              {allTags.map((t) => (
                <label key={t.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.tagIds.includes(t.id)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        tagIds: toggleId(f.tagIds, t.id),
                      }))
                    }
                  />
                  <span className="form-check-label">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="border rounded p-2">
            <div className="fw-semibold mb-2">Trends</div>
            <div
              className="d-flex flex-column gap-1"
              style={{ maxHeight: 240, overflow: "auto" }}
            >
              {allTrends.map((tr) => (
                <label key={tr.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.trendIds.includes(tr.id)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        trendIds: toggleId(f.trendIds, tr.id),
                      }))
                    }
                  />
                  <span className="form-check-label">{tr.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 d-flex justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => nav("/admin")}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>

      <div className="text-muted small mt-3">
        Note: your current `/books/{id}` returns genre/tag names, not ids. For
        perfect edit-fill, later we’ll add endpoints to return ids too (easy).
      </div>
    </div>
  );
}
