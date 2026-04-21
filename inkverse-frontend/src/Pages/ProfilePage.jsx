import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";
import "./ProfilePage.css";
import { absUrl } from "../Utils/absUrl";
import Surface from "../Shared/ui/Surface";
import Button from "../Shared/ui/Button";
import Chip from "../Shared/ui/Chip";
import Segmented from "../Shared/ui/Segmented";
import TextField from "../Shared/ui/TextField";
import DropdownSelect from "../Shared/ui/DropdownSelect";
import LoadingState from "../Shared/ui/LoadingState";
import ErrorState from "../Shared/ui/ErrorState";
import EmptyState from "../Shared/ui/EmptyState";

const DEFAULT_SETTINGS = {
  isProfilePublic: true,
  emailNotificationsEnabled: true,
  readingRemindersEnabled: false,
  preferredLanguage: "en",
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const { auth, setAuth } = useContext(AuthContext);
  const sessionUser = auth?.user;

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileErr, setProfileErr] = useState("");

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsErr, setReviewsErr] = useState("");

  const [booksReadCount, setBooksReadCount] = useState(0);
  const [booksReadLoading, setBooksReadLoading] = useState(true);
  const [booksReadErr, setBooksReadErr] = useState("");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsErr, setSettingsErr] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedText, setSettingsSavedText] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);

  const uploadAvatar = async (file) => {
    if (!file) return;

    try {
      setAvatarUploading(true);

      const fd = new FormData();
      fd.append("File", file);

      const res = await api.post("/uploads/users/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url ?? res.data?.Url ?? "";
      if (!url) {
        alert("Upload succeeded but no url returned.");
        return;
      }

      setEditAvatar(url);
    } catch (e) {
      console.error("uploadAvatar failed:", e);
      alert(e?.response?.data?.message || "Avatar upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const loadBooksRead = async () => {
    try {
      setBooksReadErr("");
      setBooksReadLoading(true);

      const res = await api.get("/me/library");
      const items = Array.isArray(res.data) ? res.data : [];

      const read = items.filter(
        (x) =>
          (x.lastReadChapterId ?? x.LastReadChapterId ?? null) != null ||
          (x.lastReadAt ?? x.LastReadAt ?? null) != null ||
          (x.isCompleted ?? x.IsCompleted ?? false) === true,
      );

      setBooksReadCount(read.length);
    } catch (e) {
      console.error("loadBooksRead failed:", e);
      setBooksReadCount(0);
      setBooksReadErr("Failed to load reading history.");
    } finally {
      setBooksReadLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      setProfileErr("");
      setProfileLoading(true);
      const res = await api.get("/me/profile");
      setProfile(res.data);

      setEditBio(res.data?.bio ?? "");
      setEditAvatar(res.data?.avatarUrl ?? "");
    } catch (e) {
      console.error("loadProfile failed:", e);
      setProfile(null);
      setProfileErr("Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsErr("");
      setReviewsLoading(true);
      const res = await api.get("/me/reviews");
      setMyReviews(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(
        "loadReviews failed:",
        e?.response?.status,
        e?.response?.data || e.message,
      );
      setMyReviews([]);
      setReviewsErr(
        e?.response?.status === 401
          ? "Please sign in."
          : e?.response?.status === 404
            ? "Reviews endpoint not found (/me/reviews)."
            : "Failed to load reviews.",
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  const normalizeSettings = (raw) => ({
    isProfilePublic:
      raw?.isProfilePublic ?? raw?.IsProfilePublic ?? DEFAULT_SETTINGS.isProfilePublic,
    emailNotificationsEnabled:
      raw?.emailNotificationsEnabled ??
      raw?.EmailNotificationsEnabled ??
      DEFAULT_SETTINGS.emailNotificationsEnabled,
    readingRemindersEnabled:
      raw?.readingRemindersEnabled ??
      raw?.ReadingRemindersEnabled ??
      DEFAULT_SETTINGS.readingRemindersEnabled,
    preferredLanguage:
      raw?.preferredLanguage ??
      raw?.PreferredLanguage ??
      DEFAULT_SETTINGS.preferredLanguage,
  });

  const loadSettings = async () => {
    try {
      setSettingsErr("");
      setSettingsLoading(true);
      const res = await api.get("/me/settings");
      setSettings(normalizeSettings(res.data));
    } catch (e) {
      console.error("loadSettings failed:", e);
      setSettings(DEFAULT_SETTINGS);
      setSettingsErr("Failed to load settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      setSettingsErr("");
      const payload = {
        isProfilePublic: !!settings.isProfilePublic,
        emailNotificationsEnabled: !!settings.emailNotificationsEnabled,
        readingRemindersEnabled: !!settings.readingRemindersEnabled,
        preferredLanguage: settings.preferredLanguage || "en",
      };

      const res = await api.put("/me/settings", payload);
      setSettings(normalizeSettings(res.data));
      setSettingsSavedText(`Saved ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      console.error("saveSettings failed:", e);
      setSettingsErr(e?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (!sessionUser?.id) return;
    loadProfile();
    loadReviews();
    loadBooksRead();
    loadSettings();
  }, [sessionUser?.id]);

  const getCreatedAt = (p) => p?.createdAt ?? p?.CreatedAt ?? null;

  const parseDateSafe = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value) ? null : value;

    const s = String(value).trim();
    if (!s) return null;

    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const createdDate = useMemo(
    () => parseDateSafe(getCreatedAt(profile)),
    [profile],
  );

  const joinedText = useMemo(() => {
    return createdDate ? createdDate.toLocaleDateString() : "Unknown";
  }, [createdDate]);

  const memberForText = useMemo(() => {
    if (!createdDate) return "-";

    const now = new Date();
    let months =
      (now.getFullYear() - createdDate.getFullYear()) * 12 +
      (now.getMonth() - createdDate.getMonth());

    if (now.getDate() < createdDate.getDate()) months -= 1;

    if (months <= 0) {
      const days = Math.max(0, Math.floor((now - createdDate) / 86400000));
      return days <= 1 ? "1 day" : `${days} days`;
    }

    const years = Math.floor(months / 12);
    const remMonths = months % 12;

    if (years <= 0) return remMonths === 1 ? "1 month" : `${remMonths} months`;
    if (remMonths === 0) return years === 1 ? "1 year" : `${years} years`;
    return `${years}y ${remMonths}m`;
  }, [createdDate]);

  if (!sessionUser) {
    return (
      <div className="container my-4">
        <div className="alert alert-warning mb-0">Please sign in to view your profile.</div>
      </div>
    );
  }

  const displayName =
    profile?.userName || sessionUser?.userName || sessionUser?.email || "User";

  const avatar =
    profile?.avatarUrl ||
    sessionUser?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

  const avatarSrc = avatar.startsWith("http") ? avatar : absUrl(avatar);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await api.put("/me/profile", {
        bio: editBio,
        avatarUrl: editAvatar,
      });
      setProfile(res.data);
      setEditing(false);

      setAuth?.((prev) => ({
        ...prev,
        user: {
          ...(prev?.user || {}),
          bio: res.data?.bio,
          avatarUrl: res.data?.avatarUrl,
        },
      }));
    } catch (e) {
      console.error("saveProfile failed:", e);
      alert("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const tabOptions = [
    { value: "profile", label: "Overview" },
    { value: "works", label: "My Works" },
    { value: "reviews", label: "Reviews" },
    { value: "achievements", label: "Achievements" },
    { value: "activity", label: "Activity" },
    { value: "settings", label: "Settings" },
  ];

  const statItems = [
    {
      label: "Books Read",
      value: booksReadLoading ? "..." : booksReadCount,
      help: booksReadErr,
    },
    {
      label: "Reviews",
      value: reviewsLoading ? "..." : myReviews.length,
      help: reviewsErr,
    },
    {
      label: "Member For",
      value: profileLoading ? "..." : memberForText,
    },
  ];

  return (
    <div className="profile-page-wrap container my-4">
      <section className="profile-hero-shell mb-4">
        <div className="profile-hero-glow" />

        <div className="profile-hero-main">
          <div className="profile-identity-block">
            <div className="profile-avatar-shell">
              <img className="profile-avatar" src={avatarSrc} alt={displayName} />
            </div>

            <div className="profile-identity-copy">
              <p className="profile-kicker mb-2">Inkverse Profile</p>
              <h1 className="profile-display-name mb-2">{displayName}</h1>
              <p className="profile-bio mb-3">
                {profileLoading
                  ? "Loading bio..."
                  : profile?.bio || "No bio yet. Add one to introduce yourself."}
              </p>

              <div className="profile-meta-row">
                <Chip tone="neutral">Joined {joinedText}</Chip>
                <Chip tone="neutral">Member {profileLoading ? "..." : memberForText}</Chip>
              </div>
            </div>
          </div>

          <div className="profile-action-block">
            <Button
              variant="primary"
              type="button"
              onClick={() => {
                setEditing((v) => !v);
                setEditBio(profile?.bio ?? "");
                setEditAvatar(profile?.avatarUrl ?? "");
              }}
              disabled={profileLoading || !!profileErr}
            >
              {editing ? "Close Editor" : "Edit Profile"}
            </Button>

            <Link to="/my-library" className="profile-library-link">
              Open My Library
            </Link>

            {profileErr ? (
              <div className="profile-shared-state profile-shared-state-sm">
                <ErrorState title="Could not load profile" subtitle={profileErr} onRetry={loadProfile} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="profile-stats-grid">
          {statItems.map((item) => (
            <Surface key={item.label} className="profile-stat-card">
              <p className="profile-stat-label mb-1">{item.label}</p>
              <p className="profile-stat-value mb-0">{item.value}</p>
              {item.help ? <p className="profile-stat-help mb-0">{item.help}</p> : null}
            </Surface>
          ))}
        </div>

        {editing && (
          <Surface className="profile-editor-card mt-3">
            <h2 className="profile-editor-title">Edit your profile</h2>

            <div className="profile-editor-grid">
              <div>
                <label className="profile-field-label" htmlFor="avatarUpload">
                  Upload avatar
                </label>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  className="form-control"
                  disabled={avatarUploading}
                  onChange={(e) => uploadAvatar(e.target.files?.[0])}
                />
                {avatarUploading ? <div className="profile-field-help">Uploading...</div> : null}

                <label className="profile-field-label mt-2" htmlFor="avatarUrlInput">
                  Or paste avatar URL
                </label>
                <TextField
                  id="avatarUrlInput"
                  value={editAvatar}
                  onChange={setEditAvatar}
                  placeholder="https://..."
                />

                {editAvatar ? (
                  <img
                    className="profile-editor-avatar-preview"
                    src={editAvatar.startsWith("http") ? editAvatar : absUrl(editAvatar)}
                    alt="Avatar preview"
                  />
                ) : null}
              </div>

              <div>
                <label className="profile-field-label" htmlFor="bioInput">
                  Bio
                </label>
                <textarea
                  id="bioInput"
                  className="form-control"
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Write something about yourself..."
                />
              </div>
            </div>

            <div className="profile-editor-actions">
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditing(false)}
                disabled={savingProfile}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Surface>
        )}
      </section>

      <Segmented
        className="mb-4"
        value={activeTab}
        onChange={setActiveTab}
        options={tabOptions}
      />

      {activeTab === "profile" && (
        <Surface className="profile-content-panel">
          <h3 className="profile-panel-title">Account Details</h3>
          <dl className="profile-detail-grid mb-0">
            <div>
              <dt>Username</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{joinedText}</dd>
            </div>
            <div>
              <dt>Member For</dt>
              <dd>{profileLoading ? "..." : memberForText}</dd>
            </div>
            <div>
              <dt>Reviews Written</dt>
              <dd>{reviewsLoading ? "..." : myReviews.length}</dd>
            </div>
          </dl>
        </Surface>
      )}

      {activeTab === "works" && (
        <Surface className="profile-content-panel profile-placeholder-panel">
          <h3 className="profile-panel-title">My Works</h3>
          <p className="mb-0">Author features are under construction and will appear here.</p>
        </Surface>
      )}

      {activeTab === "reviews" && (
        <Surface className="profile-content-panel">
          <h3 className="profile-panel-title mb-3">My Reviews</h3>

          {reviewsLoading ? (
            <LoadingState text="Loading your reviews..." />
          ) : reviewsErr ? (
            <ErrorState title="Could not load reviews" subtitle={reviewsErr} onRetry={loadReviews} />
          ) : myReviews.length ? (
            <div className="profile-review-list">
              {myReviews.map((r) => {
                const coverSrc = r.bookCoverUrl
                  ? r.bookCoverUrl.startsWith("http")
                    ? r.bookCoverUrl
                    : absUrl(r.bookCoverUrl)
                  : "";
                const reviewDate = r.createdAt
                  ? new Date(r.createdAt).toLocaleString()
                  : "Unknown date";

                return (
                  <Surface key={r.id} className="profile-review-card">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={r.bookTitle || "Book cover"}
                        className="profile-review-cover"
                      />
                    ) : (
                      <div className="profile-review-cover placeholder" />
                    )}

                    <div className="profile-review-copy">
                      <div className="profile-review-head">
                        <Link to={`/book/${r.bookId}`} className="profile-review-book-link">
                          {r.bookTitle}
                        </Link>
                        <Chip tone="neutral">{r.rating} / 5</Chip>
                      </div>

                      <p className="profile-review-date">{reviewDate}</p>
                      <p className="profile-review-content mb-0">{r.content}</p>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No reviews yet"
              subtitle="Once you review books, they will appear here."
            />
          )}
        </Surface>
      )}

      {activeTab === "achievements" && (
        <Surface className="profile-content-panel profile-placeholder-panel">
          <h3 className="profile-panel-title">Achievements</h3>
          <p className="mb-0">Achievement badges and milestones will be available soon.</p>
        </Surface>
      )}

      {activeTab === "activity" && (
        <Surface className="profile-content-panel profile-placeholder-panel">
          <h3 className="profile-panel-title">Activity Feed</h3>
          <p className="mb-0">Your reading and review activity timeline will appear here.</p>
        </Surface>
      )}

      {activeTab === "settings" && (
        <Surface className="profile-content-panel">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3 flex-wrap">
            <div>
              <h3 className="profile-panel-title mb-1">Settings</h3>
              <p className="text-muted mb-0">Control privacy, notifications, and reading preferences.</p>
            </div>
            {settingsSavedText ? <Chip tone="neutral">{settingsSavedText}</Chip> : null}
          </div>

          {settingsLoading ? (
            <LoadingState text="Loading settings..." />
          ) : settingsErr ? (
            <ErrorState title="Could not load settings" subtitle={settingsErr} onRetry={loadSettings} />
          ) : (
            <div className="profile-settings-form">
              <label className="profile-settings-row">
                <span>
                  <strong>Public Profile</strong>
                  <small>Allow other users to view your profile details.</small>
                </span>
                <input
                  type="checkbox"
                  checked={!!settings.isProfilePublic}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      isProfilePublic: e.target.checked,
                    }))
                  }
                />
              </label>

              <label className="profile-settings-row">
                <span>
                  <strong>Email Notifications</strong>
                  <small>Get updates about account and activity by email.</small>
                </span>
                <input
                  type="checkbox"
                  checked={!!settings.emailNotificationsEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      emailNotificationsEnabled: e.target.checked,
                    }))
                  }
                />
              </label>

              <label className="profile-settings-row">
                <span>
                  <strong>Reading Reminders</strong>
                  <small>Enable periodic reminders to continue reading.</small>
                </span>
                <input
                  type="checkbox"
                  checked={!!settings.readingRemindersEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      readingRemindersEnabled: e.target.checked,
                    }))
                  }
                />
              </label>

              <div className="profile-settings-language">
                <label className="profile-field-label" htmlFor="preferredLanguage">
                  Preferred Language
                </label>
                <DropdownSelect
                  value={settings.preferredLanguage}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, preferredLanguage: value }))
                  }
                  options={LANGUAGE_OPTIONS}
                />
              </div>

              <div className="profile-editor-actions mt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={loadSettings}
                  disabled={savingSettings}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onClick={saveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          )}
        </Surface>
      )}
    </div>
  );
}
