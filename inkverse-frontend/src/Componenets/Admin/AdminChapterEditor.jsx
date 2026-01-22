import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";

export default function AdminChapterEditor({ mode }) {
  const nav = useNavigate();
  const { bookId, chapterId } = useParams();

  const bId = Number(bookId);
  const isEdit = mode === "edit";
  const cId = isEdit ? Number(chapterId) : null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [arcs, setArcs] = useState([]);
  const [newArcName, setNewArcName] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    chapterNumber: 1,
    arcId: null,
  });

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const arcsRes = await api.get(`/admin/books/${bId}/arcs`);
      setArcs(Array.isArray(arcsRes.data) ? arcsRes.data : []);

      if (isEdit && cId) {
        const res = await api.get(`/admin/books/${bId}/chapters/${cId}`);
        const c = res.data;

        setForm({
          title: c.title ?? "",
          content: c.content ?? "",
          chapterNumber: c.chapterNumber ?? 1,
          arcId: c.arcId ?? null,
        });
      }
    } catch (e) {
      console.error(e);
      setErr("Failed to load chapter.");
    } finally {
      setLoading(false);
    }
  };

  const createArc = async () => {
    const name = newArcName.trim();
    if (!name) return;

    try {
      const res = await api.post(`/admin/books/${bId}/arcs`, { name });
      const created = res.data;

      const arcsRes = await api.get(`/admin/books/${bId}/arcs`);
      const list = Array.isArray(arcsRes.data) ? arcsRes.data : [];
      setArcs(list);

      // auto-select new arc
const newId = created?.id ?? created?.ID ?? created?.Id ?? null;
setForm((f) => ({ ...f, arcId: newId }));

      setNewArcName("");
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to create arc.");
    }
  };

useEffect(() => {
  if (!bId) return;
  load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [bId, cId]);

  const save = async () => {
    try {
      setErr("");

      if (!form.title.trim()) {
        setErr("Title is required.");
        return;
      }
      if (!form.content.trim()) {
        setErr("Content is required.");
        return;
      }
      if (
        isEdit &&
        (!Number(form.chapterNumber) || Number(form.chapterNumber) < 1)
      ) {
        setErr("ChapterNumber must be >= 1.");
        return;
      }

      const payload = {
        title: form.title,
        content: form.content,
        arcId: form.arcId,
         chapterNumber: Number(form.chapterNumber)
      };

      if (isEdit) payload.chapterNumber = Number(form.chapterNumber);

      if (!isEdit) {
        await api.post(`/admin/books/${bId}/chapters`, payload);
      } else {
        await api.put(`/admin/books/${bId}/chapters/${cId}`, payload);
      }

      nav(`/admin/books/${bId}/chapters`);
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
        <h4 className="mb-0">{isEdit ? "Edit Chapter" : "New Chapter"}</h4>
        <button
          className="btn btn-outline-secondary"
          onClick={() => nav(`/admin/books/${bId}/chapters`)}
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

        {isEdit && (
          <div className="col-12 col-md-4">
            <label className="form-label">Chapter Number</label>
            <input
              type="number"
              className="form-control"
              value={form.chapterNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, chapterNumber: e.target.value }))
              }
            />
          </div>
        )}

        <div className="col-12">
          <label className="form-label">Arc (optional)</label>

          <select
            className="form-select"
            value={form.arcId ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                arcId: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
          >
            <option value="">No Arc</option>
                {arcs.map((a) => {
                const id = a.id ?? a.ID;
                const name = a.name ?? a.Name;
                return (
                    <option key={id} value={id}>
                    {name}
                    </option>
                );
                })}
          </select>

          <div className="d-flex gap-2 mt-2">
            <input
              className="form-control"
              placeholder="New arc name..."
              value={newArcName}
              onChange={(e) => setNewArcName(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={createArc}
            >
              Create
            </button>
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">Content</label>
          <textarea
            className="form-control"
            rows={14}
            value={form.content}
            onChange={(e) =>
              setForm((f) => ({ ...f, content: e.target.value }))
            }
          />
          <div className="text-muted small mt-1">
            Tip: multi-line text is fine here (Axios handles JSON escaping).
          </div>
        </div>

        <div className="col-12 d-flex justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => nav(`/admin/books/${bId}/chapters`)}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
