import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";
import "./ProfilePage.css";
import { absUrl } from "../Utils/absUrl";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const { auth, setAuth } = useContext(AuthContext);
  const sessionUser = auth?.user;

  // Profile data from backend
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileErr, setProfileErr] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Reviews
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsErr, setReviewsErr] = useState("");

  const [booksReadCount, setBooksReadCount] = useState(0);
  const [booksReadLoading, setBooksReadLoading] = useState(true);
  const [booksReadErr, setBooksReadErr] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);

  const uploadAvatar = async (file) => {
    if (!file) return;

    try {
      setAvatarUploading(true);

      const fd = new FormData();
      fd.append("File", file); // must match dto name

      const res = await api.post("/uploads/users/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url ?? res.data?.Url ?? "";
      if (!url) {
        alert("Upload succeeded but no url returned.");
        return;
      }

      // Put it in edit field (so user can Save)
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

      // ✅ pick ONE endpoint that exists in your backend:
      // Option A (most likely): library endpoint already used in Browse
      const res = await api.get("/me/library");

      // if your DTO has: isInLibrary + lastReadChapterId OR lastReadAt etc.
      const items = Array.isArray(res.data) ? res.data : [];

      // Count "read" books:
      // If you store lastReadChapterId => treat as read
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

  useEffect(() => {
    if (!sessionUser?.id) return;
    loadProfile();
    loadReviews();
    loadBooksRead();
  }, [sessionUser?.id]);
const getCreatedAt = (p) => p?.createdAt ?? p?.CreatedAt ?? null;

const parseDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;

  const s = String(value).trim();
  if (!s) return null;

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const createdDate = useMemo(() => parseDateSafe(getCreatedAt(profile)), [profile]);

const joinedText = useMemo(() => {
  return createdDate ? createdDate.toLocaleDateString() : "Unknown";
}, [createdDate]);

const memberForText = useMemo(() => {
  if (!createdDate) return "—";

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
        <div className="alert alert-warning mb-0">
          Please sign in to view your profile.
        </div>
      </div>
    );
  }

  const loadProfile = async () => {
    try {
      setProfileErr("");
      setProfileLoading(true);
      const res = await api.get("/me/profile");
      setProfile(res.data);

      // preload edit fields
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

      // Optional: reflect changes in AuthContext user
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

  const tabs = [
    { key: "profile", label: "Profile Info" },
    { key: "works", label: "My Works" }, // under construction
    { key: "reviews", label: "My Reviews" },
    { key: "achievements", label: "Achievements" },
    { key: "activity", label: "Activity Feed" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="container my-4">
      {/* Glass Header */}
      <div className="profile-hero p-4 mb-4">
        <div className="row align-items-center">
          <div className="col-md-3 text-center">
            <img className="profile-avatar" src={avatarSrc} alt={displayName} />
          </div>

          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <h2 className="text-start mb-1">{displayName}</h2>

                <p className="text-muted text-start mb-0">
                  {profileLoading
                    ? "Loading bio..."
                    : profile?.bio || "No bio yet."}
                </p>
              </div>

              <div className="row justify-content-end  gap-2">
                <button
                  className="btn btn-outline-secondary w-auto me-4"
                  type="button"
                  onClick={() => {
                    setEditing((v) => !v);
                    setEditBio(profile?.bio ?? "");
                    setEditAvatar(profile?.avatarUrl ?? "");
                  }}
                  disabled={profileLoading || !!profileErr}
                >
                  <i className="bi bi-pencil-square me-1" />
                  Edit
                </button>
              </div>
            </div>

            {profileErr && (
              <div className="text-danger small mt-2">{profileErr}</div>
            )}

            {/* Edit Box */}
            {editing && (
              <div className="mt-3 p-3 profile-stat">
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label small">Upload avatar</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      disabled={avatarUploading}
                      onChange={(e) => uploadAvatar(e.target.files?.[0])}
                    />
                    {avatarUploading ? (
                      <div className="small text-muted mt-1">Uploading...</div>
                    ) : null}

                    {editAvatar ? (
                      <div className="mt-2">
                        <img
                          src={absUrl(editAvatar)}
                          alt="preview"
                          style={{
                            width: 90,
                            height: 90,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="col-12">
                    <label className="form-label small">Bio</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write something about you..."
                    />
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2">
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setEditing(false)}
                      disabled={savingProfile}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="row mt-3">
              <div className="col-md-4 mb-2">
                <div className="profile-stat p-3 text-center">
                  <div className="fw-bold fs-4">
                    {booksReadLoading ? "..." : booksReadCount}
                  </div>
                  <div className="text-muted">Books read</div>
                  {booksReadErr ? (
                    <div className="text-danger small mt-1">{booksReadErr}</div>
                  ) : null}
                </div>
              </div>

              <div className="col-md-4 mb-2">
                <div className="profile-stat p-3 text-center">
                  <div className="fw-bold fs-4">
                    {reviewsLoading ? "..." : myReviews.length}
                  </div>
                  <div className="text-muted">Reviews</div>
                </div>
              </div>

              <div className="col-md-4 mb-2">
                <div className="profile-stat p-3 text-center">
                  <div className="fw-bold fs-4">
                    {profileLoading ? "..." : memberForText}
                  </div>
                  <div className="text-muted">Member for</div>
                </div>
              </div>
            </div>

            {/* Quick shortcuts */}
            <div className="d-flex gap-2 mt-3 flex-wrap"></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav mb-4 justify-content-between">
        {tabs.map((t) => (
          <li className="profile-tab profile-tabs nav-item" key={t.key}>
            <button
              className={`profile-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
              type="button"
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Content */}
      {activeTab === "profile" && (
        <div className="border rounded p-4 text-start">
          <h4>Account Details</h4>
          <ul className="list-unstyled mb-3">
            <li>
              <strong>Username:</strong> {displayName}
            </li>
            <li>
              <strong>Joined:</strong> {joinedText}
            </li>
            <li>
              <strong>Member for:</strong>{" "}
              {profileLoading ? "..." : memberForText}
            </li>
            <li>
              <strong>Reviews Written:</strong>{" "}
              {reviewsLoading ? "..." : myReviews.length}
            </li>
          </ul>
        </div>
      )}

      {activeTab === "works" && (
        <div className="border rounded p-4 text-center">
          <h4>My Works</h4>
          <p className="text-muted mb-0 alert alert-info mb-0">
            Under construction 🚧 — author features will live here soon...
            Maybe...
          </p>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="rounded p-4">
          <h4 className="mb-3">My Reviews</h4>
          {reviewsLoading ? (
            <p className="text-muted">Loading...</p>
          ) : reviewsErr ? (
            <p className="text-danger">{reviewsErr}</p>
          ) : myReviews.length ? (
            <div className="d-flex flex-column gap-2">
              {myReviews.map((r) => (
                <div key={r.id} className="border shadow reviewHo rounded p-3">
                  <div className="d-flex gap-3">
                    {r.bookCoverUrl ? (
                      <img
                        src={r.bookCoverUrl}
                        alt={r.bookTitle}
                        style={{
                          width: 104,
                          height: 128,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    ) : (
                      <div
                        style={{ width: 54, height: 78 }}
                        className="border rounded"
                      />
                    )}

                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <Link
                          to={`/book/${r.bookId}`}
                          className="fw-semibold text-decoration-none"
                        >
                          {r.bookTitle}
                        </Link>
                        <span className="bi bi-star-fill text-warning">
                          <span className="text-black"> {r.rating}</span>
                        </span>
                      </div>

                      <div className="small text-muted text-start border-bottom">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>

                      <div className="mt-2 text-start border rounded p-2">
                        {r.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0">No reviews yet.</p>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="border rounded p-4">
          <h4>Achievements</h4>
          <div className="alert alert-info mb-0">Under construction.</div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="border rounded p-4">
          <h4>Activity Feed</h4>
          <div className="alert alert-info mb-0">Under construction.</div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="border rounded p-4">
          <h4>Settings</h4>
          <div className="alert alert-info mb-0">Under construction.</div>
        </div>
      )}
    </div>
  );
}
