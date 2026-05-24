import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../Shared/ui/Button";
import EmptyState from "../Shared/ui/EmptyState";
import ErrorState from "../Shared/ui/ErrorState";
import LoadingState from "../Shared/ui/LoadingState";
import Segmented from "../Shared/ui/Segmented";
import UserAvatar from "../Shared/user/UserAvatar";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../Api/notifications.api";
import "./NotificationsPage.css";

const CATEGORY_FILTERS = [
  { value: "", label: "All" },
  { value: "book_updates", label: "Books" },
  { value: "author_updates", label: "Authors" },
  { value: "interactions", label: "Interactions" },
  { value: "author_activity", label: "Author activity" },
  { value: "reports", label: "Reports" },
  { value: "system", label: "System" },
];

function readField(item, camelKey, pascalKey = "") {
  return item?.[camelKey] ?? item?.[pascalKey || camelKey[0].toUpperCase() + camelKey.slice(1)];
}

function formatTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function notificationCategoryLabel(category) {
  return CATEGORY_FILTERS.find((item) => item.value === category)?.label ?? "Notification";
}

function NotificationRow({ item, onOpen, onDelete }) {
  const id = readField(item, "id");
  const title = readField(item, "title") || "Notification";
  const body = readField(item, "body") || "";
  const linkUrl = readField(item, "linkUrl") || "";
  const category = readField(item, "category") || "";
  const isRead = !!readField(item, "isRead");
  const actorName = readField(item, "actorName") || "";
  const actorAvatarUrl = readField(item, "actorAvatarUrl") || "";
  const createdAt = readField(item, "createdAt");

  return (
    <article className={`notifications-row ${isRead ? "" : "is-unread"}`}>
      <button
        type="button"
        className="notifications-row__main"
        onClick={() => onOpen(item)}
      >
        <span className="notifications-row__avatar">
          <UserAvatar
            className="notifications-row__avatar-img"
            src={actorAvatarUrl}
            name={actorName || title}
          />
        </span>

        <span className="notifications-row__copy">
          <span className="notifications-row__meta">
            <span>{notificationCategoryLabel(category)}</span>
            <span>{formatTime(createdAt)}</span>
          </span>
          <strong>{title}</strong>
          {body ? <span>{body}</span> : null}
        </span>

        <span className="notifications-row__state" aria-hidden="true" />
      </button>

      <div className="notifications-row__actions">
        {linkUrl ? (
          <Link className="notifications-link" to={linkUrl} onClick={() => onOpen(item, true)}>
            Open
          </Link>
        ) : null}
        <button
          type="button"
          className="notifications-delete"
          onClick={() => onDelete(id)}
          aria-label="Dismiss notification"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      setItems(await fetchNotifications({ filter, category, take: 60 }));
    } catch (error) {
      console.error("load notifications failed:", error);
      setItems([]);
      setErr(error?.response?.data?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [category, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((item) => !readField(item, "isRead")).length,
    [items],
  );

  const openNotification = async (item, keepNavigation = false) => {
    const id = readField(item, "id");
    const linkUrl = readField(item, "linkUrl") || "";

    if (id && !readField(item, "isRead")) {
      try {
        const updated = await markNotificationRead(id);
        setItems((current) =>
          current.map((entry) => (readField(entry, "id") === id ? updated : entry)),
        );
      } catch (error) {
        console.error("mark notification read failed:", error);
      }
    }

    if (!keepNavigation && linkUrl) navigate(linkUrl);
  };

  const markAll = async () => {
    try {
      setBusy(true);
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true, IsRead: true })));
    } catch (error) {
      console.error("mark all notifications failed:", error);
      window.alert(error?.response?.data?.message || "Could not mark notifications as read.");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async (id) => {
    if (!id) return;
    try {
      await deleteNotification(id);
      setItems((current) => current.filter((item) => readField(item, "id") !== id));
    } catch (error) {
      console.error("dismiss notification failed:", error);
      window.alert(error?.response?.data?.message || "Could not dismiss notification.");
    }
  };

  return (
    <main className="notifications-page-wrap">
      <section className="notifications-hero">
        <div>
          <p className="notifications-kicker">InkVerse inbox</p>
          <h1>Notifications</h1>
          <p>
            New chapters, author follows, replies, report updates, and system
            messages stay here until you read or dismiss them.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={markAll} disabled={busy || unreadCount === 0}>
          Mark all read
        </Button>
      </section>

      <section className="notifications-panel">
        <div className="notifications-toolbar">
          <Segmented
            className="notifications-filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "unread", label: `Unread ${unreadCount ? `(${unreadCount})` : ""}` },
            ]}
          />

          <Segmented
            className="notifications-filter notifications-filter--categories"
            value={category}
            onChange={setCategory}
            options={CATEGORY_FILTERS}
          />
        </div>

        {loading ? (
          <LoadingState text="Loading notifications..." />
        ) : err ? (
          <ErrorState title="Notifications unavailable" subtitle={err} onRetry={load} />
        ) : items.length ? (
          <div className="notifications-list">
            {items.map((item) => (
              <NotificationRow
                key={readField(item, "id")}
                item={item}
                onOpen={openNotification}
                onDelete={dismiss}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing to read"
            subtitle="When something needs your attention, it will appear here."
          />
        )}
      </section>
    </main>
  );
}
