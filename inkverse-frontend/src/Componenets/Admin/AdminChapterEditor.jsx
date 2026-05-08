import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminFormField from "../../features/admin/components/AdminFormField";

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
        const chapter = res.data;

        setForm({
          title: chapter.title ?? "",
          content: chapter.content ?? "",
          chapterNumber: chapter.chapterNumber ?? 1,
          arcId: chapter.arcId ?? null,
        });
      }
    } catch (error) {
      console.error(error);
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
      const newId = created?.id ?? created?.ID ?? created?.Id ?? null;
      setForm((current) => ({ ...current, arcId: newId }));
      setNewArcName("");
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.message || "Failed to create arc.");
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
      if (isEdit && (!Number(form.chapterNumber) || Number(form.chapterNumber) < 1)) {
        setErr("Chapter number must be at least 1.");
        return;
      }

      const payload = {
        title: form.title,
        content: form.content,
        arcId: form.arcId,
        chapterNumber: Number(form.chapterNumber),
      };

      if (!isEdit) {
        await api.post(`/admin/books/${bId}/chapters`, payload);
      } else {
        await api.put(`/admin/books/${bId}/chapters/${cId}`, payload);
      }

      nav(`/admin/books/${bId}/chapters`);
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.message || "Save failed.");
    }
  };

  if (loading) return <LoadingState text="Loading chapter editor..." />;

  return (
    <AdminSection
      actions={
        <Button variant="outline" onClick={() => nav(`/admin/books/${bId}/chapters`)}>
          Back
        </Button>
      }
    >
      {err ? <div className="admin-alert">{err}</div> : null}

      <div className="admin-form-grid">
        <AdminFormField label="Title" className="admin-col-12">
          <input
            className="admin-input"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </AdminFormField>

        {isEdit ? (
          <AdminFormField label="Chapter number" className="admin-col-4">
            <input
              type="number"
              className="admin-input"
              value={form.chapterNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, chapterNumber: event.target.value }))
              }
            />
          </AdminFormField>
        ) : null}

        <AdminFormField label="Arc" className="admin-col-8">
          <select
            className="admin-select"
            value={form.arcId ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                arcId: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
          >
            <option value="">No arc</option>
            {arcs.map((arc) => {
              const id = arc.id ?? arc.ID;
              const name = arc.name ?? arc.Name;
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
        </AdminFormField>

        <AdminFormField label="Create new arc" className="admin-col-12">
          <div className="admin-inline-actions">
            <input
              className="admin-input"
              placeholder="Arc name"
              value={newArcName}
              onChange={(event) => setNewArcName(event.target.value)}
            />
            <Button variant="outline" onClick={createArc}>
              Create arc
            </Button>
          </div>
        </AdminFormField>

        <AdminFormField
          label="Content"
          hint="Multi-line text is fine here. JSON escaping is handled by Axios."
          className="admin-col-12"
        >
          <textarea
            className="admin-textarea"
            rows={16}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
          />
        </AdminFormField>

        <div className="admin-col-12 admin-form-actions">
          <Button variant="outline" onClick={() => nav(`/admin/books/${bId}/chapters`)}>
            Cancel
          </Button>
          <Button onClick={save}>Save chapter</Button>
        </div>
      </div>
    </AdminSection>
  );
}
