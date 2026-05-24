import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../Api/api";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "../Api/notifications.api";
import AuthContext from "../Context/AuthProvider";
import "./ProfilePage.css";
import Button from "../Shared/ui/Button";
import Chip from "../Shared/ui/Chip";
import Segmented from "../Shared/ui/Segmented";
import DropdownSelect from "../Shared/ui/DropdownSelect";
import LoadingState from "../Shared/ui/LoadingState";
import ErrorState from "../Shared/ui/ErrorState";
import EmptyState from "../Shared/ui/EmptyState";
import BookCover from "../Shared/Books/BookCover/BookCover";
import UserAvatar from "../Shared/user/UserAvatar";
import { getBookCoverSrc } from "../domain/books/book-cover";
import { getLanguageOptions, normalizeLanguageCode, setAppLanguage } from "../i18n";

const AVATAR_CANVAS_SIZE = 512;
const AVATAR_EDITOR_FALLBACK_SIZE = 280;

const DEFAULT_SETTINGS = {
  isProfilePublic: true,
  showReviewsOnProfile: true,
  showCommentsOnProfile: true,
  showLibraryOnProfile: false,
  showAuthorBooksOnProfile: true,
  emailNotificationsEnabled: true,
  readingRemindersEnabled: false,
  preferredLanguage: "en",
  timezone: (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  })(),
};

const NOTIFICATION_CATEGORY_OPTIONS = [
  {
    category: "book_updates",
    title: "Book updates",
    hint: "New chapters from books saved in your library.",
  },
  {
    category: "author_updates",
    title: "Author updates",
    hint: "New books from authors you follow.",
  },
  {
    category: "interactions",
    title: "Interactions",
    hint: "Replies and positive reactions on your reviews and comments.",
  },
  {
    category: "author_activity",
    title: "Author activity",
    hint: "New reader reviews and comments on your books.",
  },
  {
    category: "reports",
    title: "Reports",
    hint: "Report decisions and admin report alerts.",
  },
  {
    category: "system",
    title: "System",
    hint: "Important platform notices from InkVerse.",
  },
];

function normalizeNotificationPreferences(raw) {
  const rows = Array.isArray(raw) ? raw : [];
  return NOTIFICATION_CATEGORY_OPTIONS.reduce((acc, option) => {
    const match = rows.find(
      (item) =>
        (item?.category ?? item?.Category ?? "").toLowerCase() === option.category,
    );
    acc[option.category] = match
      ? !!(match.inAppEnabled ?? match.InAppEnabled)
      : true;
    return acc;
  }, {});
}

function formatDateTime(value) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleString();
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function distance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function getAvatarCropStyle(imageW, imageH, zoom, offsetX, offsetY, frameW, frameH) {
  if (!imageW || !imageH) return null;
  const baseScale = Math.max(frameW / imageW, frameH / imageH);
  const drawW = imageW * baseScale * zoom;
  const drawH = imageH * baseScale * zoom;

  return {
    width: `${drawW}px`,
    height: `${drawH}px`,
    left: `${(frameW - drawW) / 2 + offsetX}px`,
    top: `${(frameH - drawH) / 2 + offsetY}px`,
  };
}

function getAvatarOffsetBounds(imageW, imageH, zoom) {
  if (!imageW || !imageH) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const baseScale = Math.max(AVATAR_CANVAS_SIZE / imageW, AVATAR_CANVAS_SIZE / imageH);
  const drawW = imageW * baseScale * zoom;
  const drawH = imageH * baseScale * zoom;
  const maxOffsetX = Math.max(0, (drawW - AVATAR_CANVAS_SIZE) / 2);
  const maxOffsetY = Math.max(0, (drawH - AVATAR_CANVAS_SIZE) / 2);

  return {
    minX: -maxOffsetX,
    maxX: maxOffsetX,
    minY: -maxOffsetY,
    maxY: maxOffsetY,
  };
}

function clampAvatarDraft(draft, imageW, imageH) {
  const zoom = clamp(Number(draft?.zoom) || 1, 1, 3);
  const bounds = getAvatarOffsetBounds(imageW, imageH, zoom);

  return {
    zoom,
    offsetX: clamp(Number(draft?.offsetX) || 0, bounds.minX, bounds.maxX),
    offsetY: clamp(Number(draft?.offsetY) || 0, bounds.minY, bounds.maxY),
  };
}

async function buildAvatarUploadFile(file, { size = AVATAR_CANVAS_SIZE, zoom = 1, offsetX = 0, offsetY = 0 } = {}) {
  const srcUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromUrl(srcUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to prepare avatar image.");

    ctx.fillStyle = "#eef4ff";
    ctx.fillRect(0, 0, size, size);

    const baseScale = Math.max(size / image.width, size / image.height);
    const drawW = image.width * baseScale * zoom;
    const drawH = image.height * baseScale * zoom;
    const drawX = (size - drawW) / 2 + offsetX;
    const drawY = (size - drawH) / 2 + offsetY;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.9);
    });

    if (!blob) throw new Error("Could not build avatar image.");
    return new File([blob], "profile-avatar.webp", { type: blob.type || "image/webp" });
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { auth, setAuth } = useContext(AuthContext);
  const sessionUser = auth?.user;
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const tabOptions = useMemo(
    () => [
      { value: "overview", label: t("profile.tabs.overview") },
      { value: "reviews", label: t("profile.tabs.reviews") },
      { value: "settings", label: t("profile.tabs.settings") },
    ],
    [t],
  );
  const settingsSectionOptions = useMemo(
    () => [
      { value: "general", label: t("profile.settings.sections.general") },
      { value: "privacy", label: t("profile.settings.sections.privacy") },
      { value: "notifications", label: "Notifications" },
    ],
    [t],
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [settingsSection, setSettingsSection] = useState("general");

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileErr, setProfileErr] = useState("");

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarEditor, setAvatarEditor] = useState({
    open: false,
    file: null,
    previewUrl: "",
    imageW: 0,
    imageH: 0,
  });
  const [avatarDraft, setAvatarDraft] = useState({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [avatarFrameSize, setAvatarFrameSize] = useState({
    width: AVATAR_EDITOR_FALLBACK_SIZE,
    height: AVATAR_EDITOR_FALLBACK_SIZE,
  });
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioCanExpand, setBioCanExpand] = useState(false);
  const [bioExpandedHeight, setBioExpandedHeight] = useState("0px");
  const bioRef = useRef(null);
  const avatarDraftRef = useRef(avatarDraft);
  const avatarDragRef = useRef(null);
  const avatarTouchRef = useRef(null);
  const avatarFrameRef = useRef(null);
  const avatarPreviewUrlRef = useRef("");

  useEffect(() => {
    avatarDraftRef.current = avatarDraft;
  }, [avatarDraft]);

  const cleanupAvatarPreview = useCallback((url) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    avatarPreviewUrlRef.current = avatarEditor.previewUrl;
  }, [avatarEditor.previewUrl]);

  useEffect(() => () => cleanupAvatarPreview(avatarPreviewUrlRef.current), [cleanupAvatarPreview]);

  const getAvatarFrameSize = useCallback(() => {
    const rect = avatarFrameRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return avatarFrameSize;
    return { width: rect.width, height: rect.height };
  }, [avatarFrameSize]);

  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsErr, setReviewsErr] = useState("");

  const [booksReadCount, setBooksReadCount] = useState(0);
  const [booksReadLoading, setBooksReadLoading] = useState(true);
  const [booksReadErr, setBooksReadErr] = useState("");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notificationPreferences, setNotificationPreferences] = useState(() =>
    normalizeNotificationPreferences([]),
  );
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsErr, setSettingsErr] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedText, setSettingsSavedText] = useState("");

  useEffect(() => {
    if (!avatarEditor.open) return undefined;

    const updateFrameSize = () => {
      const rect = avatarFrameRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;
      setAvatarFrameSize({ width: rect.width, height: rect.height });
    };

    updateFrameSize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateFrameSize) : null;
    if (observer && avatarFrameRef.current) observer.observe(avatarFrameRef.current);
    window.addEventListener("resize", updateFrameSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateFrameSize);
    };
  }, [avatarEditor.open]);

  const closeAvatarEditor = () => {
    avatarDragRef.current = null;
    avatarTouchRef.current = null;
    cleanupAvatarPreview(avatarEditor.previewUrl);
    setAvatarEditor({ open: false, file: null, previewUrl: "", imageW: 0, imageH: 0 });
    setAvatarDraft({ zoom: 1, offsetX: 0, offsetY: 0 });
  };

  const handleAvatarFileChange = async (file) => {
    if (!file) return;

    cleanupAvatarPreview(avatarEditor.previewUrl);
    const previewUrl = URL.createObjectURL(file);

    try {
      const image = await loadImageFromUrl(previewUrl);
      setAvatarEditor({
        open: true,
        file,
        previewUrl,
        imageW: image.width,
        imageH: image.height,
      });
      setAvatarDraft({ zoom: 1, offsetX: 0, offsetY: 0 });
    } catch (error) {
      console.error("load avatar image failed:", error);
      cleanupAvatarPreview(previewUrl);
      alert(t("profile.errors.avatarUploadFailed"));
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;

    try {
      setAvatarUploading(true);

      const formData = new FormData();
      formData.append("File", file);

      const res = await api.post("/uploads/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url ?? res.data?.Url ?? "";
      if (!url) {
        alert(t("profile.errors.uploadNoUrl"));
        return;
      }

      setEditAvatar(url);
      closeAvatarEditor();
    } catch (error) {
      console.error("uploadAvatar failed:", error);
      alert(error?.response?.data?.message || t("profile.errors.avatarUploadFailed"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const confirmAvatarCrop = async () => {
    if (!avatarEditor.file || avatarUploading) return;

    try {
      setAvatarUploading(true);
      const nextDraft = clampAvatarDraft(avatarDraft, avatarEditor.imageW, avatarEditor.imageH);
      const croppedFile = await buildAvatarUploadFile(avatarEditor.file, nextDraft);
      await uploadAvatar(croppedFile);
    } catch (error) {
      console.error("confirmAvatarCrop failed:", error);
      alert(t("profile.errors.avatarUploadFailed"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const updateAvatarZoom = (zoom) => {
    setAvatarDraft((current) => clampAvatarDraft({ ...current, zoom }, avatarEditor.imageW, avatarEditor.imageH));
  };

  const handleAvatarWheel = (event) => {
    event.preventDefault();
    updateAvatarZoom(avatarDraftRef.current.zoom + (event.deltaY < 0 ? 0.06 : -0.06));
  };

  const handleAvatarMouseDown = (event) => {
    event.preventDefault();
    avatarDragRef.current = {
      lastX: event.clientX,
      lastY: event.clientY,
    };
  };

  const handleAvatarTouchStart = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      avatarTouchRef.current = { mode: "pan", lastX: touch.clientX, lastY: touch.clientY };
      return;
    }

    if (event.touches.length >= 2) {
      const firstTouch = event.touches[0];
      const secondTouch = event.touches[1];
      const mid = midpoint(firstTouch, secondTouch);
      avatarTouchRef.current = {
        mode: "pinch",
        startDistance: distance(firstTouch, secondTouch),
        startZoom: avatarDraftRef.current.zoom,
        startOffsetX: avatarDraftRef.current.offsetX,
        startOffsetY: avatarDraftRef.current.offsetY,
        startMidX: mid.x,
        startMidY: mid.y,
      };
    }
  };

  const handleAvatarTouchMove = (event) => {
    if (!avatarTouchRef.current) return;
    event.preventDefault();

    if (avatarTouchRef.current.mode === "pan" && event.touches.length === 1) {
      const touch = event.touches[0];
      const dx = touch.clientX - avatarTouchRef.current.lastX;
      const dy = touch.clientY - avatarTouchRef.current.lastY;
      avatarTouchRef.current.lastX = touch.clientX;
      avatarTouchRef.current.lastY = touch.clientY;

      const frameSize = getAvatarFrameSize();
      setAvatarDraft((current) => clampAvatarDraft({
        ...current,
        offsetX: current.offsetX + dx * (AVATAR_CANVAS_SIZE / frameSize.width),
        offsetY: current.offsetY + dy * (AVATAR_CANVAS_SIZE / frameSize.height),
      }, avatarEditor.imageW, avatarEditor.imageH));
      return;
    }

    if (avatarTouchRef.current.mode === "pinch" && event.touches.length >= 2) {
      const firstTouch = event.touches[0];
      const secondTouch = event.touches[1];
      const currentDistance = distance(firstTouch, secondTouch);
      const currentMid = midpoint(firstTouch, secondTouch);
      const ratio = currentDistance / Math.max(avatarTouchRef.current.startDistance, 1);
      const frameSize = getAvatarFrameSize();
      const dx = (currentMid.x - avatarTouchRef.current.startMidX) * (AVATAR_CANVAS_SIZE / frameSize.width);
      const dy = (currentMid.y - avatarTouchRef.current.startMidY) * (AVATAR_CANVAS_SIZE / frameSize.height);

      setAvatarDraft((current) => clampAvatarDraft({
        ...current,
        zoom: avatarTouchRef.current.startZoom * ratio,
        offsetX: avatarTouchRef.current.startOffsetX + dx,
        offsetY: avatarTouchRef.current.startOffsetY + dy,
      }, avatarEditor.imageW, avatarEditor.imageH));
    }
  };

  const handleAvatarTouchEnd = (event) => {
    if (event.touches.length === 0) {
      avatarTouchRef.current = null;
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      avatarTouchRef.current = { mode: "pan", lastX: touch.clientX, lastY: touch.clientY };
    }
  };

  useEffect(() => {
    if (!avatarEditor.open) return undefined;

    const handleMove = (event) => {
      if (!avatarDragRef.current) return;

      const dx = event.clientX - avatarDragRef.current.lastX;
      const dy = event.clientY - avatarDragRef.current.lastY;
      avatarDragRef.current.lastX = event.clientX;
      avatarDragRef.current.lastY = event.clientY;

      const frameSize = getAvatarFrameSize();
      const dxCanvas = dx * (AVATAR_CANVAS_SIZE / frameSize.width);
      const dyCanvas = dy * (AVATAR_CANVAS_SIZE / frameSize.height);

      setAvatarDraft((current) => clampAvatarDraft({
        ...current,
        offsetX: current.offsetX + dxCanvas,
        offsetY: current.offsetY + dyCanvas,
      }, avatarEditor.imageW, avatarEditor.imageH));
    };

    const handleUp = () => {
      avatarDragRef.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [avatarEditor.open, avatarEditor.imageW, avatarEditor.imageH, getAvatarFrameSize]);

  const loadBooksRead = async () => {
    try {
      setBooksReadErr("");
      setBooksReadLoading(true);

      const res = await api.get("/me/library");
      const items = Array.isArray(res.data) ? res.data : [];

      const readItems = items.filter(
        (item) =>
          (item.lastReadChapterId ?? item.LastReadChapterId ?? null) != null ||
          (item.lastReadAt ?? item.LastReadAt ?? null) != null ||
          (item.isCompleted ?? item.IsCompleted ?? false) === true,
      );

      setBooksReadCount(readItems.length);
    } catch (error) {
      console.error("loadBooksRead failed:", error);
      setBooksReadCount(0);
      setBooksReadErr(t("profile.errors.booksReadFailed"));
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
    } catch (error) {
      console.error("loadProfile failed:", error);
      setProfile(null);
      setProfileErr(t("profile.errors.profileFailed"));
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
    } catch (error) {
      console.error(
        "loadReviews failed:",
        error?.response?.status,
        error?.response?.data || error.message,
      );
      setMyReviews([]);
      setReviewsErr(
        error?.response?.status === 401
          ? t("profile.errors.signInRequired")
          : error?.response?.status === 404
            ? t("profile.errors.reviewsEndpointMissing")
            : t("profile.errors.reviewsFailed"),
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  const normalizeSettings = (raw) => ({
    isProfilePublic:
      raw?.isProfilePublic ?? raw?.IsProfilePublic ?? DEFAULT_SETTINGS.isProfilePublic,
    showReviewsOnProfile:
      raw?.showReviewsOnProfile ??
      raw?.ShowReviewsOnProfile ??
      DEFAULT_SETTINGS.showReviewsOnProfile,
    showCommentsOnProfile:
      raw?.showCommentsOnProfile ??
      raw?.ShowCommentsOnProfile ??
      DEFAULT_SETTINGS.showCommentsOnProfile,
    showLibraryOnProfile:
      raw?.showLibraryOnProfile ??
      raw?.ShowLibraryOnProfile ??
      DEFAULT_SETTINGS.showLibraryOnProfile,
    showAuthorBooksOnProfile:
      raw?.showAuthorBooksOnProfile ??
      raw?.ShowAuthorBooksOnProfile ??
      DEFAULT_SETTINGS.showAuthorBooksOnProfile,
    emailNotificationsEnabled:
      raw?.emailNotificationsEnabled ??
      raw?.EmailNotificationsEnabled ??
      DEFAULT_SETTINGS.emailNotificationsEnabled,
    readingRemindersEnabled:
      raw?.readingRemindersEnabled ??
      raw?.ReadingRemindersEnabled ??
      DEFAULT_SETTINGS.readingRemindersEnabled,
    preferredLanguage:
      normalizeLanguageCode(
        raw?.preferredLanguage ??
          raw?.PreferredLanguage ??
          DEFAULT_SETTINGS.preferredLanguage,
      ),
    timezone: raw?.timezone ?? raw?.Timezone ?? DEFAULT_SETTINGS.timezone,
  });

  const loadSettings = async () => {
    try {
      setSettingsErr("");
      setSettingsLoading(true);

      const [settingsResult, notificationsResult] = await Promise.allSettled([
        api.get("/me/settings"),
        fetchNotificationPreferences(),
      ]);

      if (settingsResult.status === "fulfilled") {
        setSettings(normalizeSettings(settingsResult.value.data));
      } else {
        throw settingsResult.reason;
      }

      if (notificationsResult.status === "fulfilled") {
        setNotificationPreferences(normalizeNotificationPreferences(notificationsResult.value));
      } else {
        setNotificationPreferences(normalizeNotificationPreferences([]));
      }
    } catch (error) {
      console.error("loadSettings failed:", error);
      setSettings(DEFAULT_SETTINGS);
      setNotificationPreferences(normalizeNotificationPreferences([]));
      setSettingsErr(t("profile.errors.settingsFailed"));
    } finally {
      setSettingsLoading(false);
    }
  };

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
    } catch (error) {
      console.error("saveProfile failed:", error);
      alert(t("profile.errors.saveProfileFailed"));
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      setSettingsErr("");

      const payload = {
        isProfilePublic: !!settings.isProfilePublic,
        showReviewsOnProfile: !!settings.showReviewsOnProfile,
        showCommentsOnProfile: !!settings.showCommentsOnProfile,
        showLibraryOnProfile: !!settings.showLibraryOnProfile,
        showAuthorBooksOnProfile: !!settings.showAuthorBooksOnProfile,
        emailNotificationsEnabled: !!settings.emailNotificationsEnabled,
        readingRemindersEnabled: !!settings.readingRemindersEnabled,
        preferredLanguage: settings.preferredLanguage || "en",
        timezone: settings.timezone || DEFAULT_SETTINGS.timezone,
      };

      const preferencePayload = NOTIFICATION_CATEGORY_OPTIONS.map((option) => ({
        category: option.category,
        inAppEnabled: notificationPreferences[option.category] !== false,
      }));

      const [res, savedPreferences] = await Promise.all([
        api.put("/me/settings", payload),
        updateNotificationPreferences(preferencePayload),
      ]);
      setSettings(normalizeSettings(res.data));
      setNotificationPreferences(normalizeNotificationPreferences(savedPreferences));
      setSettingsSavedText(
        t("profile.settings.saved", { time: new Date().toLocaleTimeString() }),
      );
    } catch (error) {
      console.error("saveSettings failed:", error);
      setSettingsErr(error?.response?.data?.message || t("profile.errors.settingsFailed"));
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (!sessionUser) return;

    loadProfile();
    loadReviews();
    loadBooksRead();
    loadSettings();
  }, [sessionUser?.id, sessionUser?.email, sessionUser?.userName]);

  useEffect(() => {
    setBioExpanded(false);
  }, [profile?.bio, profileLoading]);

  useEffect(() => {
    if (editing) return undefined;

    const node = bioRef.current;
    if (!node) return undefined;

    const checkOverflow = () => {
      const computed = window.getComputedStyle(node);
      const lineHeight = Number.parseFloat(computed.lineHeight) || 27;
      const collapsedHeight = lineHeight * 3 + 2;
      setBioExpandedHeight(`${Math.ceil(node.scrollHeight)}px`);
      setBioCanExpand(node.scrollHeight > collapsedHeight + 2);
    };

    const frame = window.requestAnimationFrame(checkOverflow);
    window.addEventListener("resize", checkOverflow);

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(checkOverflow);
      observer.observe(node);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", checkOverflow);
      observer?.disconnect();
    };
  }, [editing, profile?.bio, profileLoading]);

  const createdDate = useMemo(() => {
    const raw = profile?.createdAt ?? profile?.CreatedAt ?? null;
    if (!raw) return null;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [profile]);

  const joinedText = useMemo(() => {
    return createdDate ? createdDate.toLocaleDateString() : t("profile.unknownJoined");
  }, [createdDate, t]);

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

  const displayName =
    profile?.userName || sessionUser?.userName || sessionUser?.email || t("profile.userFallback");

  const displayHandle = sessionUser?.userName ? `@${sessionUser.userName}` : sessionUser?.email;

  const avatarSrc = profile?.avatarUrl || sessionUser?.avatarUrl || "";
  const readerLevel = profile?.readerLevel ?? profile?.ReaderLevel ?? 1;
  const totalChaptersRead = profile?.totalChaptersRead ?? profile?.TotalChaptersRead ?? 0;
  const featuredAchievements = Array.isArray(profile?.featuredAchievements ?? profile?.FeaturedAchievements)
    ? (profile?.featuredAchievements ?? profile?.FeaturedAchievements)
    : [];

  const editorAvatarSrc = editAvatar || avatarSrc;

  const avatarEditorStyle = useMemo(() => {
    if (!avatarEditor.previewUrl || !avatarEditor.imageW || !avatarEditor.imageH) return null;
    const frameSize = avatarFrameSize;
    const offsetX = avatarDraft.offsetX * (frameSize.width / AVATAR_CANVAS_SIZE);
    const offsetY = avatarDraft.offsetY * (frameSize.height / AVATAR_CANVAS_SIZE);
    return getAvatarCropStyle(
      avatarEditor.imageW,
      avatarEditor.imageH,
      avatarDraft.zoom,
      offsetX,
      offsetY,
      frameSize.width,
      frameSize.height,
    );
  }, [avatarEditor, avatarDraft, avatarFrameSize]);

  const heroBio = profileLoading
    ? t("profile.hero.loadingBio")
    : profile?.bio || t("profile.hero.emptyBio");

  const averageReviewScore = useMemo(() => {
    if (!myReviews.length) return null;

    const total = myReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / myReviews.length).toFixed(1);
  }, [myReviews]);

  const statItems = [
    {
      label: "Reader level",
      value: profileLoading ? "..." : readerLevel,
      hint: `${Number(totalChaptersRead || 0).toLocaleString()} counted chapters`,
    },
    {
      label: t("profile.snapshot.booksTracked.label"),
      value: booksReadLoading ? "..." : booksReadCount,
      hint: booksReadErr || t("profile.snapshot.booksTracked.hint"),
    },
    {
      label: t("profile.snapshot.reviewsPosted.label"),
      value: reviewsLoading ? "..." : myReviews.length,
      hint: reviewsErr || t("profile.snapshot.reviewsPosted.hint"),
    },
    {
      label: t("profile.snapshot.memberFor.label"),
      value: profileLoading ? "..." : memberForText,
      hint: t("profile.snapshot.memberFor.hint"),
    },
  ];
  useEffect(() => {
    setAppLanguage(settings.preferredLanguage);
  }, [settings.preferredLanguage]);

  const openEditor = () => {
    setEditing(true);
    setEditBio(profile?.bio ?? "");
    setEditAvatar(profile?.avatarUrl ?? "");
  };

  const closeEditor = () => {
    if (savingProfile || avatarUploading) return;
    if (avatarEditor.open) closeAvatarEditor();
    setEditing(false);
    setEditBio(profile?.bio ?? "");
    setEditAvatar(profile?.avatarUrl ?? "");
  };

  if (!sessionUser) {
    return (
      <div className="profile-page-wrap profile-page-wrap--guest my-4">
        <div className="alert alert-warning mb-0">{t("profile.guest")}</div>
      </div>
    );
  }

  return (
    <div className="profile-page-wrap my-4">
      <section className="profile-shell">
        <div className="profile-hero-shell">
          <div className="profile-hero-orb profile-hero-orb--one" />
          <div className="profile-hero-orb profile-hero-orb--two" />

          {editing ? (
            <div className="profile-hero-grid profile-hero-grid--editing">
              <div className="profile-hero-editor-media">
                <label
                  className={`profile-avatar-drop${avatarUploading ? " is-disabled" : ""}`}
                  htmlFor="avatarUpload"
                >
                  <span className="profile-hero-avatar-shell profile-hero-avatar-shell--editing">
                    <UserAvatar
                      className="profile-hero-avatar profile-hero-avatar--editing"
                      src={editorAvatarSrc}
                      name={displayName}
                    />
                  </span>
                  <span className="profile-avatar-drop-overlay">
                    {t("profile.editor.uploadAvatar")}
                  </span>
                  <input
                    id="avatarUpload"
                    type="file"
                    accept="image/*"
                    className="profile-avatar-upload-input"
                    disabled={avatarUploading}
                    onChange={(e) => {
                      handleAvatarFileChange(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>

                <p className="profile-field-help">
                  {avatarUploading
                    ? t("profile.editor.uploadingAvatar")
                    : t("profile.editor.avatarHint")}
                </p>
              </div>

              <div className="profile-hero-copy profile-hero-copy--editing">
                <p className="profile-kicker">{t("profile.editor.title")}</p>
                <h1 className="profile-display-name">{displayName}</h1>
                <p className="profile-handle">{displayHandle}</p>
                <p className="profile-bio profile-bio--editing">{t("profile.editor.subtitle")}</p>

                <div className="profile-editor-inline">
                  <label className="profile-field-label" htmlFor="bioInput">
                    {t("profile.editor.bio")}
                  </label>
                  <textarea
                    id="bioInput"
                    className="profile-bio-textarea profile-bio-textarea--hero"
                    rows={7}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder={t("profile.editor.bioPlaceholder")}
                  />
                </div>
              </div>

              <div className="profile-hero-actions profile-hero-actions--editing">
                <Button
                  variant="outline"
                  type="button"
                  onClick={closeEditor}
                  disabled={savingProfile || avatarUploading}
                >
                  {t("common.actions.cancel")}
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile || avatarUploading}
                >
                  {savingProfile ? t("profile.settings.saving") : t("common.actions.saveChanges")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="profile-hero-grid">
              <div className="profile-hero-avatar-shell">
                <UserAvatar className="profile-hero-avatar" src={avatarSrc} name={displayName} />
              </div>

              <div className="profile-hero-copy">
                <p className="profile-kicker">{t("profile.hero.kicker")}</p>
                <h1 className="profile-display-name">{displayName}</h1>
                <p className="profile-handle">{displayHandle}</p>
                <div
                  className={`profile-bio-shell${bioCanExpand ? " is-collapsible" : ""}${bioExpanded ? " is-expanded" : ""}`}
                  style={{ "--profile-bio-expanded-height": bioExpandedHeight }}
                >
                  <p ref={bioRef} className="profile-bio">
                    {heroBio}
                  </p>
                </div>
                {bioCanExpand ? (
                  <button
                    type="button"
                    className="profile-bio-toggle"
                    onClick={() => setBioExpanded((current) => !current)}
                    aria-expanded={bioExpanded}
                  >
                    {bioExpanded ? t("profile.hero.showLess") : t("profile.hero.showMore")}
                  </button>
                ) : null}

                <div className="profile-meta-row">
                  <Chip tone="neutral">{t("profile.hero.joined", { date: joinedText })}</Chip>
                  <Chip tone="neutral">Level {readerLevel}</Chip>
                  {!settingsLoading ? (
                    <Chip tone="neutral">
                      {settings.isProfilePublic
                        ? t("profile.hero.public")
                        : t("profile.hero.private")}
                    </Chip>
                  ) : null}
                  {!booksReadErr ? (
                    <Chip tone="neutral">
                      {booksReadLoading
                        ? t("common.ellipsis")
                        : t("profile.hero.booksTracked", { count: booksReadCount })}
                    </Chip>
                  ) : null}
                </div>

                <div className="profile-badge-strip" aria-label="Featured achievements">
                  {featuredAchievements.length ? (
                    featuredAchievements.map((achievement) => (
                      <span
                        key={achievement.key ?? achievement.Key}
                        className={`profile-achievement-badge profile-achievement-badge--${String(
                          achievement.tier ?? achievement.Tier ?? "bronze",
                        ).toLowerCase()}`}
                      >
                        <strong>{achievement.tier ?? achievement.Tier}</strong>
                        {achievement.title ?? achievement.Title}
                      </span>
                    ))
                  ) : (
                    <span className="profile-achievement-empty">
                      Read chapters to unlock profile badges.
                    </span>
                  )}
                </div>
              </div>

              <div className="profile-hero-actions">
                <Button
                  variant="primary"
                  type="button"
                  onClick={openEditor}
                  disabled={profileLoading || !!profileErr}
                >
                  {t("common.actions.editProfile")}
                </Button>

                <Link to="/my-library" className="profile-library-link">
                  {t("common.actions.openLibrary")}
                </Link>

                <Link to="/achievements" className="profile-library-link">
                  Achievements
                </Link>
              </div>
            </div>
          )}
        </div>

        {profileErr ? (
          <div className="profile-inline-state">
            <ErrorState
              title={t("profile.errors.loadProfileTitle")}
              subtitle={profileErr}
              onRetry={loadProfile}
            />
          </div>
        ) : null}

        <Segmented
          className="profile-tabs"
          value={activeTab}
          onChange={setActiveTab}
          options={tabOptions}
        />

        {activeTab === "overview" && (
          <div className="profile-overview-grid">
            <section className="profile-panel">
              <div className="profile-section-head">
                <div>
                  <h2>{t("profile.snapshot.title")}</h2>
                  <p>{t("profile.snapshot.subtitle")}</p>
                </div>
              </div>

              <div className="profile-metric-grid">
                {statItems.map((item) => (
                  <article key={item.label} className="profile-metric-card">
                    <p className="profile-metric-label">{item.label}</p>
                    <p className="profile-metric-value">{item.value}</p>
                    <p className="profile-metric-hint">{item.hint}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="profile-panel">
              <div className="profile-section-head">
                <div>
                  <h2>{t("profile.essentials.title")}</h2>
                  <p>{t("profile.essentials.subtitle")}</p>
                </div>
              </div>

              <dl className="profile-essentials-list">
                <div>
                  <dt>{t("profile.essentials.username")}</dt>
                  <dd>{displayName}</dd>
                </div>
                <div>
                  <dt>{t("profile.essentials.email")}</dt>
                  <dd>{sessionUser?.email || t("profile.essentials.notAvailable")}</dd>
                </div>
                <div>
                  <dt>{t("profile.essentials.preferredLanguage")}</dt>
                  <dd>
                    {languageOptions.find((option) => option.value === settings.preferredLanguage)
                      ?.label || t("common.languages.en")}
                  </dd>
                </div>
                <div>
                  <dt>Timezone</dt>
                  <dd>{settings.timezone || DEFAULT_SETTINGS.timezone}</dd>
                </div>
                <div>
                  <dt>{t("profile.essentials.visibility")}</dt>
                  <dd>{settings.isProfilePublic ? t("profile.hero.public") : t("profile.hero.private")}</dd>
                </div>
                <div>
                  <dt>{t("profile.essentials.readingReminders")}</dt>
                  <dd>{settings.readingRemindersEnabled ? t("profile.essentials.enabled") : t("profile.essentials.disabled")}</dd>
                </div>
                <div>
                  <dt>{t("profile.essentials.emailUpdates")}</dt>
                  <dd>{settings.emailNotificationsEnabled ? t("profile.essentials.enabled") : t("profile.essentials.disabled")}</dd>
                </div>
              </dl>
            </section>
          </div>
        )}

        {activeTab === "reviews" && (
          <section className="profile-panel">
            <div className="profile-section-head profile-section-head--split">
              <div>
                <h2>{t("profile.reviews.title")}</h2>
                <p>{t("profile.reviews.subtitle")}</p>
              </div>

              {!reviewsLoading && !reviewsErr && myReviews.length ? (
                <div className="profile-review-summary">
                  <span>{t("profile.reviews.posted", { count: myReviews.length })}</span>
                  {averageReviewScore ? (
                    <span>{t("profile.reviews.avgRating", { rating: averageReviewScore })}</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {reviewsLoading ? (
              <LoadingState text={t("profile.reviews.loading")} />
            ) : reviewsErr ? (
              <ErrorState
                title={t("profile.errors.loadReviewsTitle")}
                subtitle={reviewsErr}
                onRetry={loadReviews}
              />
            ) : myReviews.length ? (
              <div className="profile-review-list">
                {myReviews.map((review) => {
                  const coverSrc = getBookCoverSrc(review);

                  return (
                    <article key={review.id} className="profile-review-item">
                      <div className="profile-review-cover">
                        <BookCover
                          variant="fill"
                          src={coverSrc}
                          alt={review.bookTitle || "Book cover"}
                          className="profile-review-coverMedia"
                        />
                      </div>

                      <div className="profile-review-body">
                        <div className="profile-review-top">
                          <div>
                            <Link
                              to={`/book/${review.bookId}`}
                              className="profile-review-book-link"
                            >
                              {review.bookTitle || t("profile.reviews.untitledBook")}
                            </Link>
                            <p className="profile-review-date">
                              {formatDateTime(review.createdAt) || t("profile.unknownDate")}
                            </p>
                          </div>

                          <div className="profile-review-score">{Number(review.rating || 0)} / 5</div>
                        </div>

                        <p className="profile-review-content">{review.content}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title={t("profile.reviews.emptyTitle")}
                subtitle={t("profile.reviews.emptySubtitleSecondary")}
              />
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <section className="profile-panel">
            <div className="profile-section-head profile-section-head--split">
              <div>
                <h2>{t("profile.settings.title")}</h2>
                <p>{t("profile.settings.subtitle")}</p>
              </div>

              {settingsSavedText ? <Chip tone="neutral">{settingsSavedText}</Chip> : null}
            </div>

            {settingsLoading ? (
              <LoadingState text={t("profile.settings.loading")} />
            ) : settingsErr ? (
              <ErrorState
                title={t("profile.settings.loadErrorTitle")}
                subtitle={settingsErr}
                onRetry={loadSettings}
              />
            ) : (
              <>
                <Segmented
                  className="profile-settings-sections"
                  value={settingsSection}
                  onChange={setSettingsSection}
                  options={settingsSectionOptions}
                />

                {settingsSection === "general" ? (
                  <div className="profile-settings-stack">
                    <label className="profile-settings-row">
                      <span>
                        <strong>{t("profile.settings.emailUpdates")}</strong>
                        <small>{t("profile.settings.emailUpdatesHint")}</small>
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
                        <strong>{t("profile.settings.readingReminders")}</strong>
                        <small>{t("profile.settings.readingRemindersHint")}</small>
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
                        {t("profile.settings.languageLabel")}
                      </label>
                      <DropdownSelect
                        value={settings.preferredLanguage}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            preferredLanguage: setAppLanguage(value),
                          }))
                        }
                        options={languageOptions}
                      />
                    </div>

                    <div className="profile-settings-language">
                      <label className="profile-field-label" htmlFor="timezoneInput">
                        Timezone
                      </label>
                      <input
                        id="timezoneInput"
                        className="profile-settings-input"
                        value={settings.timezone || ""}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            timezone: event.target.value,
                          }))
                        }
                        placeholder={DEFAULT_SETTINGS.timezone}
                      />
                    </div>
                  </div>
                ) : settingsSection === "notifications" ? (
                  <div className="profile-settings-stack">
                    <div className="profile-settings-note">
                      <strong>In-app notifications</strong>
                      <span>
                        These switches only control the InkVerse inbox and navbar
                        bell. Email settings stay separate for future email support.
                      </span>
                    </div>

                    {NOTIFICATION_CATEGORY_OPTIONS.map((option) => (
                      <label key={option.category} className="profile-settings-row">
                        <span>
                          <strong>{option.title}</strong>
                          <small>{option.hint}</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={notificationPreferences[option.category] !== false}
                          onChange={(event) =>
                            setNotificationPreferences((current) => ({
                              ...current,
                              [option.category]: event.target.checked,
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="profile-settings-stack">
                    <label className="profile-settings-row">
                      <span>
                        <strong>{t("profile.settings.publicProfile")}</strong>
                        <small>{t("profile.settings.publicProfileHint")}</small>
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
                        <strong>{t("profile.settings.showReviews")}</strong>
                        <small>{t("profile.settings.showReviewsHint")}</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={!!settings.showReviewsOnProfile}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            showReviewsOnProfile: e.target.checked,
                          }))
                        }
                      />
                    </label>

                    <label className="profile-settings-row">
                      <span>
                        <strong>{t("profile.settings.showComments")}</strong>
                        <small>{t("profile.settings.showCommentsHint")}</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={!!settings.showCommentsOnProfile}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            showCommentsOnProfile: e.target.checked,
                          }))
                        }
                      />
                    </label>

                    <label className="profile-settings-row">
                      <span>
                        <strong>{t("profile.settings.showAuthorBooks")}</strong>
                        <small>{t("profile.settings.showAuthorBooksHint")}</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={!!settings.showAuthorBooksOnProfile}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            showAuthorBooksOnProfile: e.target.checked,
                          }))
                        }
                      />
                    </label>

                    <label className="profile-settings-row">
                      <span>
                        <strong>{t("profile.settings.showLibrary")}</strong>
                        <small>{t("profile.settings.showLibraryHint")}</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={!!settings.showLibraryOnProfile}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            showLibraryOnProfile: e.target.checked,
                          }))
                        }
                      />
                    </label>
                  </div>
                )}

                <div className="profile-editor-actions profile-editor-actions--settings">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={loadSettings}
                    disabled={savingSettings}
                  >
                    {t("common.actions.reset")}
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={saveSettings}
                    disabled={savingSettings}
                  >
                    {savingSettings ? t("profile.settings.saving") : t("profile.settings.save")}
                  </Button>
                </div>
              </>
            )}
          </section>
        )}
      </section>

      {avatarEditor.open ? (
        <div
          className="profile-avatar-editor-backdrop"
          onClick={() => {
            if (!avatarUploading) closeAvatarEditor();
          }}
        >
          <div
            className="profile-avatar-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profileAvatarEditorTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="profileAvatarEditorTitle">
              {t("profile.editor.adjustAvatar", { defaultValue: "Adjust profile image" })}
            </h2>

            <div className="profile-avatar-editor-stage">
              <div
                ref={avatarFrameRef}
                className="profile-avatar-editor-frame"
                onWheel={handleAvatarWheel}
                onMouseDown={handleAvatarMouseDown}
                onTouchStart={handleAvatarTouchStart}
                onTouchMove={handleAvatarTouchMove}
                onTouchEnd={handleAvatarTouchEnd}
              >
                {avatarEditorStyle ? (
                  <img
                    src={avatarEditor.previewUrl}
                    alt={t("profile.editor.avatarEditorAlt", { defaultValue: "Profile image editor" })}
                    className="profile-avatar-editor-image"
                    style={avatarEditorStyle}
                    draggable={false}
                  />
                ) : null}
              </div>
            </div>

            <label className="profile-avatar-editor-range">
              <span>{t("profile.editor.zoom", { defaultValue: "Zoom" })}</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={avatarDraft.zoom}
                onChange={(event) => updateAvatarZoom(event.target.value)}
              />
            </label>

            <div className="profile-avatar-editor-actions">
              <Button
                type="button"
                variant="outline"
                onClick={closeAvatarEditor}
                disabled={avatarUploading}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={confirmAvatarCrop}
                disabled={avatarUploading}
              >
                {avatarUploading
                  ? t("profile.editor.uploadingAvatar")
                  : t("profile.editor.confirmAvatar", { defaultValue: "Confirm" })}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
