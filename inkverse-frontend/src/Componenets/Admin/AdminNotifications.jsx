import { useState } from "react";
import Button from "../../Shared/ui/Button";
import AdminSection from "../../features/admin/components/AdminSection";
import { sendSystemNotification } from "../../Api/notifications.api";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All users" },
  { value: "role", label: "Role" },
  { value: "users", label: "Selected users" },
];

export default function AdminNotifications() {
  const [form, setForm] = useState({
    audience: "all",
    role: "Author",
    userIds: "",
    title: "",
    body: "",
    linkUrl: "",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  const updateField = (field, value) => {
    setResult("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setResult("Title and body are required.");
      return;
    }

    const payload = {
      audience: form.audience,
      title: form.title.trim(),
      body: form.body.trim(),
      linkUrl: form.linkUrl.trim() || null,
    };

    if (form.audience === "role") payload.role = form.role.trim();
    if (form.audience === "users") {
      payload.userIds = form.userIds
        .split(/[,\n]/)
        .map((id) => id.trim())
        .filter(Boolean);
    }

    try {
      setSending(true);
      const response = await sendSystemNotification(payload);
      const sent = response?.sentCount ?? response?.SentCount ?? 0;
      setResult(`Sent ${Number(sent).toLocaleString()} system notification${sent === 1 ? "" : "s"}.`);
      setForm((current) => ({ ...current, title: "", body: "", linkUrl: "" }));
    } catch (error) {
      console.error("send system notification failed:", error);
      setResult(error?.response?.data?.message || "Could not send system notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminSection
      title="System notifications"
      subtitle="Send an in-app notice to everyone, one role, or selected users. No email or push is sent in v1."
    >
      <form className="admin-notification-form" onSubmit={submit}>
        <div className="admin-notification-grid">
          <label className="admin-form-field">
            <span className="admin-form-field__label">Audience</span>
            <select
              className="admin-select"
              value={form.audience}
              onChange={(event) => updateField("audience", event.target.value)}
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {form.audience === "role" ? (
            <label className="admin-form-field">
              <span className="admin-form-field__label">Role</span>
              <input
                className="admin-input"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                placeholder="Author"
              />
            </label>
          ) : null}

          <label className="admin-form-field">
            <span className="admin-form-field__label">Link URL</span>
            <input
              className="admin-input"
              value={form.linkUrl}
              onChange={(event) => updateField("linkUrl", event.target.value)}
              placeholder="/notifications"
            />
          </label>
        </div>

        {form.audience === "users" ? (
          <label className="admin-form-field">
            <span className="admin-form-field__label">User IDs</span>
            <textarea
              className="admin-textarea"
              value={form.userIds}
              onChange={(event) => updateField("userIds", event.target.value)}
              placeholder="Paste user IDs, one per line or comma separated."
              rows={4}
            />
          </label>
        ) : null}

        <label className="admin-form-field">
          <span className="admin-form-field__label">Title</span>
          <input
            className="admin-input"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Maintenance window tonight"
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-form-field__label">Body</span>
          <textarea
            className="admin-textarea"
            value={form.body}
            onChange={(event) => updateField("body", event.target.value)}
            placeholder="Write the notice users will see in their notification inbox."
            rows={5}
          />
        </label>

        <div className="admin-notification-actions">
          {result ? <p className="admin-notification-result">{result}</p> : null}
          <Button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send notification"}
          </Button>
        </div>
      </form>
    </AdminSection>
  );
}
