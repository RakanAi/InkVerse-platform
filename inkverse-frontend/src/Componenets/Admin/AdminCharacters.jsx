import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import { absUrl } from "../../Utils/absUrl";
import { buildBookCoverUploadFile } from "../../domain/books/build-book-cover-upload-file";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminFormField from "../../features/admin/components/AdminFormField";
import AdminDialog from "../../features/admin/components/AdminDialog";

const API_BASE = "/admin/characters";
const LINKED_BOOKS_PAGE_SIZE = 10;

const CHARACTER_FORM_DEFAULTS = {
  id: null,
  worldId: 0,
  name: "",
  slug: "",
  role: "",
  aliases: "",
  summary: "",
  profile: "",
  imageUrl: "",
  imagePreview: "",
  isActive: true,
  sortOrder: 0,
};

const WORLD_FORM_DEFAULTS = {
  id: null,
  name: "",
  slug: "",
  summary: "",
  imageUrl: "",
  imagePreview: "",
  isActive: true,
  sortOrder: 0,
};

function revokeBlobUrl(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function resolveImageUrl(url) {
  if (!url) return "";
  return url.startsWith("blob:") ? url : absUrl(url);
}

function normalizeBook(book) {
  return {
    id: book.id ?? book.ID,
    title: book.title ?? book.Title ?? `Book ${book.id ?? book.ID}`,
    coverImageUrl: book.coverImageUrl ?? book.CoverImageUrl ?? "",
    authorName: book.authorName ?? book.AuthorName ?? "",
    status: book.status ?? book.Status ?? "",
  };
}

function CharacterArtwork({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolved = src && !failed ? src : "";

  return (
    <div className={`admin-character-artwork ${className}`.trim()}>
      {resolved ? (
        <img src={resolved} alt={alt} onError={() => setFailed(true)} />
      ) : (
        <div className="admin-character-artwork__placeholder">No portrait</div>
      )}
    </div>
  );
}

export default function AdminCharacters() {
  const [items, setItems] = useState([]);
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [worldQuery, setWorldQuery] = useState("");
  const [q, setQ] = useState("");
  const [selectedWorldId, setSelectedWorldId] = useState(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState("create");
  const [characterForm, setCharacterForm] = useState(CHARACTER_FORM_DEFAULTS);
  const [composerSaving, setComposerSaving] = useState(false);
  const [composerUploading, setComposerUploading] = useState(false);

  const [worldComposerOpen, setWorldComposerOpen] = useState(false);
  const [worldComposerMode, setWorldComposerMode] = useState("create");
  const [worldForm, setWorldForm] = useState(WORLD_FORM_DEFAULTS);
  const [worldSaving, setWorldSaving] = useState(false);
  const [worldUploading, setWorldUploading] = useState(false);

  const [imageDialogCharacter, setImageDialogCharacter] = useState(null);
  const [linkedDialogCharacter, setLinkedDialogCharacter] = useState(null);
  const [linkedBooks, setLinkedBooks] = useState([]);
  const [linkedBooksLoading, setLinkedBooksLoading] = useState(false);
  const [linkedBooksFilter, setLinkedBooksFilter] = useState("");
  const [linkedBooksPage, setLinkedBooksPage] = useState(1);
  const [linkedBookCounts, setLinkedBookCounts] = useState({});
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState("");
  const [linkingBookId, setLinkingBookId] = useState(null);
  const [unlinkingBookId, setUnlinkingBookId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingWorldId, setDeletingWorldId] = useState(null);

  const getId = (character) => character.id ?? character.Id ?? character.ID;
  const getWorldIdFromCharacter = (character) =>
    character.worldId ?? character.WorldId ?? character.characterWorldId ?? character.CharacterWorldId ?? null;
  const getWorldNameFromCharacter = (character) =>
    character.worldName ?? character.WorldName ?? character.fandom ?? character.Fandom ?? "";
  const getName = (character) => character.name ?? character.Name ?? "";
  const getSlug = (character) => character.slug ?? character.Slug ?? "";
  const getRole = (character) => character.role ?? character.Role ?? "";
  const getAliases = (character) => character.aliases ?? character.Aliases ?? "";
  const getSummary = (character) => character.summary ?? character.Summary ?? "";
  const getProfile = (character) => character.profile ?? character.Profile ?? "";
  const getImageUrl = (character) => character.imageUrl ?? character.ImageUrl ?? "";
  const getActive = (character) =>
    (character.isActive ?? character.IsActive ?? true) === true;
  const getSortOrder = (character) =>
    Number(character.sortOrder ?? character.SortOrder ?? 0);

  const getWorldId = (world) => world.id ?? world.Id ?? world.ID;
  const getWorldName = (world) => world.name ?? world.Name ?? "";
  const getWorldSlug = (world) => world.slug ?? world.Slug ?? "";
  const getWorldSummary = (world) => world.summary ?? world.Summary ?? "";
  const getWorldImageUrl = (world) => world.imageUrl ?? world.ImageUrl ?? "";
  const getWorldActive = (world) =>
    (world.isActive ?? world.IsActive ?? true) === true;
  const getWorldSortOrder = (world) =>
    Number(world.sortOrder ?? world.SortOrder ?? 0);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const [worldsRes, itemsRes] = await Promise.all([
        api.get(`${API_BASE}/worlds`, { params: { includeInactive: true } }),
        api.get(API_BASE, { params: { includeInactive: true } }),
      ]);

      const worldItems = Array.isArray(worldsRes.data) ? worldsRes.data : [];
      const characterItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];

      setWorlds(worldItems);
      setItems(characterItems);

      setSelectedWorldId((prev) => {
        if (prev && worldItems.some((world) => getWorldId(world) === prev)) {
          return prev;
        }
        return null;
      });
    } catch (error) {
      console.error("Load character bank failed:", error);
      setWorlds([]);
      setItems([]);
      setErr("Failed to load character bank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    return () => {
      revokeBlobUrl(characterForm.imagePreview);
      revokeBlobUrl(worldForm.imagePreview);
    };
  }, [characterForm.imagePreview, worldForm.imagePreview]);

  useEffect(() => {
    if (!linkedDialogCharacter) return undefined;

    const term = catalogSearch.trim();
    if (term.length < 2) {
      setCatalogResults([]);
      setCatalogErr("");
      setCatalogLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setCatalogLoading(true);
        setCatalogErr("");
        const res = await api.get("/books", {
          params: {
            SearchTerm: term,
            SortBy: "Title",
            IsAscending: true,
            PageNumber: 1,
            PageSize: 10,
          },
        });

        setCatalogResults(
          (Array.isArray(res.data) ? res.data : []).map(normalizeBook),
        );
      } catch (error) {
        console.error("Search books failed:", error);
        setCatalogResults([]);
        setCatalogErr("Failed to search books.");
      } finally {
        setCatalogLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [catalogSearch, linkedDialogCharacter]);

  useEffect(() => {
    setLinkedBooksPage(1);
  }, [linkedBooksFilter, linkedDialogCharacter]);

  const worldCharacterCounts = useMemo(() => {
    return items.reduce((acc, character) => {
      const worldId = getWorldIdFromCharacter(character);
      if (!worldId) return acc;
      acc[worldId] = (acc[worldId] ?? 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const filteredWorlds = useMemo(() => {
    const needle = worldQuery.trim().toLowerCase();
    const filtered = needle
      ? worlds.filter((world) =>
          [getWorldName(world), getWorldSlug(world), getWorldSummary(world)]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle)),
        )
      : worlds;

    return [...filtered].sort((left, right) => {
      const orderDiff = getWorldSortOrder(left) - getWorldSortOrder(right);
      if (orderDiff !== 0) return orderDiff;
      return getWorldName(left).localeCompare(getWorldName(right));
    });
  }, [worldQuery, worlds]);

  const selectedWorld = useMemo(
    () => worlds.find((world) => getWorldId(world) === selectedWorldId) ?? null,
    [selectedWorldId, worlds],
  );

  const filteredAndSorted = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = items.filter((character) => {
      if (selectedWorldId && getWorldIdFromCharacter(character) !== selectedWorldId) {
        return false;
      }

      if (!needle) return true;

      return [
        getName(character),
        getSlug(character),
        getRole(character),
        getAliases(character),
        getWorldNameFromCharacter(character),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });

    return [...filtered].sort((left, right) => {
      const orderDiff = getSortOrder(left) - getSortOrder(right);
      if (orderDiff !== 0) return orderDiff;
      return getName(left).localeCompare(getName(right));
    });
  }, [items, q, selectedWorldId]);

  const linkedBooksFiltered = useMemo(() => {
    const needle = linkedBooksFilter.trim().toLowerCase();
    if (!needle) return linkedBooks;

    return linkedBooks.filter((book) =>
      [book.title, book.authorName, book.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [linkedBooks, linkedBooksFilter]);

  const linkedBookIdSet = useMemo(
    () => new Set(linkedBooks.map((book) => book.id)),
    [linkedBooks],
  );

  const visibleCatalogResults = useMemo(
    () => catalogResults.filter((book) => !linkedBookIdSet.has(book.id)),
    [catalogResults, linkedBookIdSet],
  );

  const linkedBooksPageCount = Math.max(
    1,
    Math.ceil(linkedBooksFiltered.length / LINKED_BOOKS_PAGE_SIZE),
  );
  const linkedBooksPageStart = (linkedBooksPage - 1) * LINKED_BOOKS_PAGE_SIZE;
  const linkedBooksPageItems = linkedBooksFiltered.slice(
    linkedBooksPageStart,
    linkedBooksPageStart + LINKED_BOOKS_PAGE_SIZE,
  );

  useEffect(() => {
    if (linkedBooksPage > linkedBooksPageCount) {
      setLinkedBooksPage(linkedBooksPageCount);
    }
  }, [linkedBooksPage, linkedBooksPageCount]);

  const setCharacterFormWithCleanup = (nextValue) => {
    setCharacterForm((prev) => {
      revokeBlobUrl(prev.imagePreview);
      return nextValue;
    });
  };

  const setWorldFormWithCleanup = (nextValue) => {
    setWorldForm((prev) => {
      revokeBlobUrl(prev.imagePreview);
      return nextValue;
    });
  };

  const resetCharacterForm = (worldId = selectedWorldId ?? 0) => {
    setCharacterFormWithCleanup({ ...CHARACTER_FORM_DEFAULTS, worldId });
  };

  const resetWorldForm = () => {
    setWorldFormWithCleanup(WORLD_FORM_DEFAULTS);
  };

  const loadLinkedBooksForCharacter = async (characterId) => {
    try {
      setLinkedBooksLoading(true);
      const res = await api.get(`${API_BASE}/${characterId}/books`, {
        params: { take: 100 },
      });
      const books = (Array.isArray(res.data) ? res.data : []).map(normalizeBook);
      setLinkedBooks(books);
      setLinkedBookCounts((prev) => ({ ...prev, [characterId]: books.length }));
    } catch (error) {
      console.error("Load linked books failed:", error);
      setLinkedBooks([]);
      window.alert("Failed to load linked books.");
    } finally {
      setLinkedBooksLoading(false);
    }
  };

  const openCreateDialog = () => {
    if (!selectedWorldId) {
      setErr("Create a world first, then add characters inside it.");
      return;
    }
    resetCharacterForm(selectedWorldId);
    setComposerMode("create");
    setComposerOpen(true);
  };

  const openEditDialog = (character) => {
    setComposerMode("edit");
    setCharacterFormWithCleanup({
      id: getId(character),
      worldId: getWorldIdFromCharacter(character) ?? selectedWorldId ?? 0,
      name: getName(character),
      slug: getSlug(character) || "",
      role: getRole(character) || "",
      aliases: getAliases(character) || "",
      summary: getSummary(character) || "",
      profile: getProfile(character) || "",
      imageUrl: getImageUrl(character) || "",
      imagePreview: "",
      isActive: getActive(character),
      sortOrder: getSortOrder(character),
    });
    setComposerOpen(true);
  };

  const closeComposerDialog = () => {
    setComposerOpen(false);
    setComposerMode("create");
    setComposerSaving(false);
    setComposerUploading(false);
    resetCharacterForm();
  };

  const openCreateWorldDialog = () => {
    resetWorldForm();
    setWorldComposerMode("create");
    setWorldComposerOpen(true);
  };

  const openEditWorldDialog = (world) => {
    setWorldComposerMode("edit");
    setWorldFormWithCleanup({
      id: getWorldId(world),
      name: getWorldName(world),
      slug: getWorldSlug(world) || "",
      summary: getWorldSummary(world) || "",
      imageUrl: getWorldImageUrl(world) || "",
      imagePreview: "",
      isActive: getWorldActive(world),
      sortOrder: getWorldSortOrder(world),
    });
    setWorldComposerOpen(true);
  };

  const closeWorldDialog = () => {
    setWorldComposerOpen(false);
    setWorldComposerMode("create");
    setWorldSaving(false);
    setWorldUploading(false);
    resetWorldForm();
  };

  const openLinkedDialog = async (character) => {
    setLinkedDialogCharacter(character);
    setLinkedBooks([]);
    setLinkedBooksFilter("");
    setLinkedBooksPage(1);
    setCatalogSearch("");
    setCatalogResults([]);
    setCatalogErr("");
    await loadLinkedBooksForCharacter(getId(character));
  };

  const closeLinkedDialog = () => {
    setLinkedDialogCharacter(null);
    setLinkedBooks([]);
    setLinkedBooksFilter("");
    setLinkedBooksPage(1);
    setCatalogSearch("");
    setCatalogResults([]);
    setCatalogErr("");
    setLinkingBookId(null);
    setUnlinkingBookId(null);
  };

  const handleCharacterImageChange = async (event) => {
    const file = event.target.files?.[0];
    const input = event.target;
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCharacterForm((prev) => {
      revokeBlobUrl(prev.imagePreview);
      return {
        ...prev,
        imagePreview: previewUrl,
      };
    });

    try {
      setComposerUploading(true);
      setErr("");
      const optimizedFile = await buildBookCoverUploadFile(file, {
        title: characterForm.name || "character",
      });
      const form = new FormData();
      form.append("file", optimizedFile);
      form.append("EntityName", characterForm.name || "character");
      form.append("Purpose", "portrait");

      const res = await api.post("/uploads/characters", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCharacterForm((prev) => ({
        ...prev,
        imageUrl: res.data?.url || "",
      }));
    } catch (error) {
      console.error("Character image upload failed:", error);
      setErr("Image upload failed.");
      setCharacterForm((prev) => ({
        ...prev,
        imageUrl: "",
      }));
    } finally {
      setComposerUploading(false);
      input.value = "";
    }
  };

  const handleWorldImageChange = async (event) => {
    const file = event.target.files?.[0];
    const input = event.target;
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setWorldForm((prev) => {
      revokeBlobUrl(prev.imagePreview);
      return {
        ...prev,
        imagePreview: previewUrl,
      };
    });

    try {
      setWorldUploading(true);
      setErr("");
      const optimizedFile = await buildBookCoverUploadFile(file, {
        title: worldForm.name || "world",
      });
      const form = new FormData();
      form.append("file", optimizedFile);
      form.append("EntityName", worldForm.name || "world");
      form.append("Purpose", "world-image");

      const res = await api.post("/uploads/characters", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setWorldForm((prev) => ({
        ...prev,
        imageUrl: res.data?.url || "",
      }));
    } catch (error) {
      console.error("World image upload failed:", error);
      setErr("World image upload failed.");
      setWorldForm((prev) => ({
        ...prev,
        imageUrl: "",
      }));
    } finally {
      setWorldUploading(false);
      input.value = "";
    }
  };

  const saveCharacter = async () => {
    const payload = {
      worldId: Number(characterForm.worldId || 0),
      name: characterForm.name.trim(),
      slug: characterForm.slug.trim() || null,
      role: characterForm.role.trim(),
      aliases: characterForm.aliases.trim() || null,
      summary: characterForm.summary.trim(),
      profile: characterForm.profile.trim() || null,
      imageUrl: characterForm.imageUrl.trim() || "",
      isActive: characterForm.isActive,
      sortOrder: Number(characterForm.sortOrder || 0),
    };

    if (!payload.name || !payload.worldId || !payload.role) {
      setErr("Name, world, and role are required.");
      return;
    }

    try {
      setComposerSaving(true);
      setErr("");

      if (composerMode === "create") {
        await api.post(API_BASE, payload);
      } else {
        await api.put(`${API_BASE}/${characterForm.id}`, payload);
      }

      closeComposerDialog();
      await load();
    } catch (error) {
      console.error("Save character failed:", error);
      setErr(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to save character.",
      );
    } finally {
      setComposerSaving(false);
    }
  };

  const saveWorld = async () => {
    const payload = {
      name: worldForm.name.trim(),
      slug: worldForm.slug.trim() || null,
      summary: worldForm.summary.trim(),
      imageUrl: worldForm.imageUrl.trim() || "",
      isActive: worldForm.isActive,
      sortOrder: Number(worldForm.sortOrder || 0),
    };

    if (!payload.name) {
      setErr("World name is required.");
      return;
    }

    try {
      setWorldSaving(true);
      setErr("");

      const res =
        worldComposerMode === "create"
          ? await api.post(`${API_BASE}/worlds`, payload)
          : await api.put(`${API_BASE}/worlds/${worldForm.id}`, payload);

      closeWorldDialog();
      await load();
      if (res?.data?.id || res?.data?.Id || res?.data?.ID) {
        setSelectedWorldId(res.data.id ?? res.data.Id ?? res.data.ID);
      }
    } catch (error) {
      console.error("Save world failed:", error);
      setErr(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to save world.",
      );
    } finally {
      setWorldSaving(false);
    }
  };

  const deleteCharacter = async (character) => {
    const name = getName(character);
    const approved = window.confirm(
      `Delete ${name}? This will also remove all book links for this character.`,
    );
    if (!approved) return;

    try {
      setDeletingId(getId(character));
      await api.delete(`${API_BASE}/${getId(character)}`);
      if (imageDialogCharacter && getId(imageDialogCharacter) === getId(character)) {
        setImageDialogCharacter(null);
      }
      if (linkedDialogCharacter && getId(linkedDialogCharacter) === getId(character)) {
        closeLinkedDialog();
      }
      await load();
    } catch (error) {
      console.error("Delete character failed:", error);
      window.alert("Failed to delete character.");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteWorld = async (world) => {
    const worldId = getWorldId(world);
    const count = worldCharacterCounts[worldId] ?? 0;
    const approved = window.confirm(
      `Delete ${getWorldName(world)}? This will remove ${count} ${count === 1 ? "character" : "characters"} inside this world too.`,
    );
    if (!approved) return;

    try {
      setDeletingWorldId(worldId);
      await api.delete(`${API_BASE}/worlds/${worldId}`);
      if (selectedWorldId === worldId) {
        setSelectedWorldId(null);
      }
      await load();
    } catch (error) {
      console.error("Delete world failed:", error);
      window.alert("Failed to delete world.");
    } finally {
      setDeletingWorldId(null);
    }
  };

  const linkBook = async (bookId) => {
    if (!linkedDialogCharacter) return;

    try {
      setLinkingBookId(bookId);
      await api.post(`${API_BASE}/${getId(linkedDialogCharacter)}/books`, {
        bookId,
      });
      await loadLinkedBooksForCharacter(getId(linkedDialogCharacter));
    } catch (error) {
      console.error("Link book failed:", error);
      window.alert("Failed to link book.");
    } finally {
      setLinkingBookId(null);
    }
  };

  const unlinkBook = async (bookId) => {
    if (!linkedDialogCharacter) return;

    try {
      setUnlinkingBookId(bookId);
      await api.delete(`${API_BASE}/${getId(linkedDialogCharacter)}/books/${bookId}`);
      await loadLinkedBooksForCharacter(getId(linkedDialogCharacter));
    } catch (error) {
      console.error("Unlink book failed:", error);
      window.alert("Failed to unlink book.");
    } finally {
      setUnlinkingBookId(null);
    }
  };

  if (loading) return <LoadingState text="Loading character bank..." />;
  if (err && !worlds.length && !items.length) {
    return (
      <ErrorState
        title="Cannot load character bank"
        subtitle={err}
        onRetry={load}
      />
    );
  }

  const previewImage =
    resolveImageUrl(characterForm.imagePreview || characterForm.imageUrl) || "";
  const previewWorldImage =
    resolveImageUrl(worldForm.imagePreview || worldForm.imageUrl) || "";
  const previewWorld =
    worlds.find((world) => getWorldId(world) === Number(characterForm.worldId)) ?? selectedWorld;

  return (
    <>
      {!selectedWorld ? (
        <AdminSection
          flat
          title="Character worlds"
          subtitle="Start by adding the anime, comic, or game universe. Open a world to manage the character templates inside it."
          actions={<Button onClick={openCreateWorldDialog}>Add world</Button>}
        >
          <div className="admin-character-worlds-toolbar">
            <TextField
              className="admin-character-worlds-toolbar__search"
              value={worldQuery}
              onChange={setWorldQuery}
              placeholder="Search world name or slug..."
            />
            {err ? <p className="admin-character-inline-error">{err}</p> : null}
          </div>

          {filteredWorlds.length ? (
            <div className="admin-world-gallery">
              {filteredWorlds.map((world) => {
                const worldId = getWorldId(world);
                const count = worldCharacterCounts[worldId] ?? 0;
                const worldSlug =
                  getWorldSlug(world) ||
                  getWorldName(world).trim().toLowerCase().replace(/\s+/g, "-");

                return (
                  <article key={worldId} className="admin-world-gallery-card">
                  <button
                    type="button"
                    className="admin-world-gallery-card__surface"
                    onClick={() => setSelectedWorldId(worldId)}
                  >
                      <CharacterArtwork
                        className="admin-world-gallery-card__art"
                        src={resolveImageUrl(getWorldImageUrl(world))}
                        alt={getWorldName(world)}
                      />

                    <div className="admin-world-gallery-card__content">
                      <h3>{getWorldName(world)}</h3>
                      <p>{worldSlug}</p>
                    </div>
                  </button>

                  <div className="admin-world-gallery-card__footer">
                    <div className="admin-world-gallery-card__meta admin-world-card__meta">
                      <span className="admin-token">
                        {count} {count === 1 ? "character" : "characters"}
                      </span>
                      <span
                          className={`admin-pill ${
                            getWorldActive(world)
                              ? "admin-pill--success"
                              : "admin-pill--warn"
                          }`}
                      >
                        {getWorldActive(world) ? "Active" : "Hidden"}
                      </span>
                    </div>

                    <Button
                      className="admin-world-gallery-card__enter"
                      onClick={() => setSelectedWorldId(worldId)}
                    >
                      Enter world
                    </Button>

                    <div className="admin-inline-actions admin-world-gallery-card__actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditWorldDialog(world)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={deletingWorldId === worldId}
                          onClick={() => deleteWorld(world)}
                        >
                          {deletingWorldId === worldId ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No worlds yet"
              subtitle="Add a comic, anime, game, or original universe first. Character templates will be created inside that world."
            />
          )}
        </AdminSection>
      ) : (
        <AdminSection
          flat
          title={`${getWorldName(selectedWorld)} character bank`}
          subtitle={
            getWorldSummary(selectedWorld).trim() ||
            "Open a character card to manage books, edit details, or retire the template."
          }
          actions={
            <div className="admin-inline-actions">
              <span className="admin-trend-toolbar__count">
                {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "template" : "templates"}
              </span>
              <Button variant="ghost" onClick={() => setSelectedWorldId(null)}>
                Back to worlds
              </Button>
              <Button variant="outline" onClick={() => openEditWorldDialog(selectedWorld)}>
                Edit world
              </Button>
              <Button onClick={openCreateDialog}>New character</Button>
            </div>
          }
        >
          <div className="admin-character-shell">
            <div className="admin-character-toolbar admin-character-toolbar--standalone">
              <TextField
                className="admin-character-toolbar__search"
                value={q}
                onChange={setQ}
                placeholder="Search character, role, or alias in this world..."
              />
            </div>

            {filteredAndSorted.length ? (
              <div className="admin-character-grid">
                {filteredAndSorted.map((character) => (
                  <article key={getId(character)} className="admin-character-card">
                    <button
                      type="button"
                      className="admin-character-card__media"
                      onClick={() => setImageDialogCharacter(character)}
                    >
                      <CharacterArtwork
                        className="admin-character-card__art"
                        src={resolveImageUrl(getImageUrl(character))}
                        alt={getName(character)}
                      />
                    </button>

                    <div className="admin-character-card__content">
                      <div className="admin-character-card__header">
                        <p className="admin-row-title">{getName(character)}</p>
                        <p className="admin-character-card__role">{getRole(character)}</p>
                        {getSlug(character) ? (
                          <p className="admin-character-card__slug">{getSlug(character)}</p>
                        ) : null}
                      </div>

                      <div className="admin-character-card__meta">
                        {getAliases(character) ? (
                          <span className="admin-token">{getAliases(character)}</span>
                        ) : null}
                        <span
                          className={`admin-pill ${
                            getActive(character)
                              ? "admin-pill--success"
                              : "admin-pill--warn"
                          }`}
                        >
                          {getActive(character) ? "Active" : "Hidden"}
                        </span>
                      </div>

                      <div className="admin-character-card__actions">
                        <Button
                          size="sm"
                          className="admin-character-card__primary"
                          onClick={() => openLinkedDialog(character)}
                        >
                          {typeof linkedBookCounts[getId(character)] === "number"
                            ? `${linkedBookCounts[getId(character)]} linked books`
                            : "Manage books"}
                        </Button>

                        <div className="admin-inline-actions admin-character-card__actions-row">
                          <Button
                            variant="outline"
                            size="sm"
                            className="admin-character-card__secondary"
                            onClick={() => openEditDialog(character)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="admin-character-card__danger"
                            disabled={deletingId === getId(character)}
                            onClick={() => deleteCharacter(character)}
                          >
                            {deletingId === getId(character) ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No characters in this world yet"
                subtitle="Create the first reusable template for this universe."
              />
            )}
          </div>
        </AdminSection>
      )}

      <AdminDialog
        open={worldComposerOpen}
        size="lg"
        className="admin-world-composer-dialog"
        title={worldComposerMode === "create" ? "Create world" : "Edit world"}
        subtitle="Add the universe first, then place reusable character templates inside it."
        onClose={closeWorldDialog}
      >
        <div className="admin-character-dialog admin-world-dialog">
          <section className="admin-character-dialog__form">
            <div className="admin-character-dialog__fields">
              <AdminFormField label="World name">
                <input
                  className="admin-input"
                  value={worldForm.name}
                  onChange={(event) =>
                    setWorldForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="One Piece"
                />
              </AdminFormField>

              <AdminFormField
                label="Slug"
                hint="Leave blank to generate it from the world name."
              >
                <input
                  className="admin-input"
                  value={worldForm.slug}
                  onChange={(event) =>
                    setWorldForm((prev) => ({
                      ...prev,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="one-piece"
                />
              </AdminFormField>

              <AdminFormField
                label="World summary"
                className="admin-character-dialog__field--wide"
                hint="This appears on the world card before someone opens the character bank."
              >
                <textarea
                  className="admin-textarea"
                  value={worldForm.summary}
                  onChange={(event) =>
                    setWorldForm((prev) => ({
                      ...prev,
                      summary: event.target.value,
                    }))
                  }
                  placeholder="Pirates, devil fruits, rival crews, and seas full of legends."
                />
              </AdminFormField>

              <AdminFormField label="Sort order">
                <input
                  className="admin-input"
                  type="number"
                  value={worldForm.sortOrder}
                  onChange={(event) =>
                    setWorldForm((prev) => ({
                      ...prev,
                      sortOrder: event.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </AdminFormField>

              <AdminFormField label="Visibility">
                <label className="admin-trend-dialog__toggle admin-inline-check">
                  <input
                    type="checkbox"
                    checked={worldForm.isActive}
                    onChange={(event) =>
                      setWorldForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  <span>Active world</span>
                </label>
              </AdminFormField>
            </div>
          </section>

          <aside className="admin-character-dialog__preview">
            <CharacterArtwork
              className="admin-character-dialog__preview-art"
              src={previewWorldImage}
              alt={worldForm.name || "World preview"}
            />

            <div className="admin-character-dialog__preview-copy">
              <span className="admin-trend-upload__eyebrow">World card</span>
              <h3>{worldForm.name.trim() || "Unnamed world"}</h3>
              <p>
                {worldForm.summary.trim() ||
                  "A short summary for this anime, comic, game, or original story world will appear here."}
              </p>
            </div>

            <div className="admin-character-upload">
              <div className="admin-character-upload__copy">
                <span className="admin-trend-upload__eyebrow">World artwork</span>
                <p className="admin-row-note">
                  Upload a recognizable cover, logo, or poster to identify this world quickly.
                </p>
              </div>

              <label className="admin-trend-upload__button admin-character-upload__button">
                {worldUploading ? "Uploading..." : "Upload artwork"}
                <input
                  className="admin-trend-upload__input"
                  type="file"
                  accept="image/*"
                  onChange={handleWorldImageChange}
                />
              </label>
            </div>

            <div className="admin-character-dialog__preview-meta">
              <span
                className={`admin-pill ${
                  worldForm.isActive ? "admin-pill--success" : "admin-pill--warn"
                }`}
              >
                {worldForm.isActive ? "Active" : "Hidden"}
              </span>
            </div>
          </aside>
        </div>

        <div className="admin-dialog__footer">
          <Button variant="outline" onClick={closeWorldDialog}>
            Cancel
          </Button>
          <Button disabled={worldSaving || worldUploading} onClick={saveWorld}>
            {worldSaving
              ? worldComposerMode === "create"
                ? "Creating..."
                : "Saving..."
              : worldComposerMode === "create"
                ? "Create world"
                : "Save world"}
          </Button>
        </div>
      </AdminDialog>

      <AdminDialog
        open={composerOpen}
        size="xl"
        className="admin-character-composer-dialog"
        title={composerMode === "create" ? "Create character" : "Edit character"}
        subtitle="Build a reusable character template inside its selected world, then attach matching books from that universe."
        onClose={closeComposerDialog}
      >
        <div className="admin-character-dialog">
          <section className="admin-character-dialog__form">
            <div className="admin-character-dialog__fields">
              <AdminFormField label="Character name">
                <input
                  className="admin-input"
                  value={characterForm.name}
                  onChange={(event) =>
                    setCharacterForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nami"
                />
              </AdminFormField>

              <AdminFormField
                label="Slug"
                hint="Leave blank to generate it from the name."
              >
                <input
                  className="admin-input"
                  value={characterForm.slug}
                  onChange={(event) =>
                    setCharacterForm((prev) => ({
                      ...prev,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="nami"
                />
              </AdminFormField>

              <AdminFormField label="World">
                <select
                  className="admin-select"
                  value={characterForm.worldId}
                  onChange={(event) =>
                    setCharacterForm((prev) => ({
                      ...prev,
                      worldId: Number(event.target.value || 0),
                    }))
                  }
                >
                  <option value={0}>Select a world</option>
                  {worlds.map((world) => (
                    <option key={getWorldId(world)} value={getWorldId(world)}>
                      {getWorldName(world)}
                    </option>
                  ))}
                </select>
              </AdminFormField>

              <AdminFormField label="Role in template">
                <input
                  className="admin-input"
                  value={characterForm.role}
                  onChange={(event) =>
                    setCharacterForm((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                  placeholder="Navigator / Straw Hat pirate"
                />
              </AdminFormField>

              <AdminFormField label="Aliases" className="admin-character-dialog__field--wide">
                <input
                  className="admin-input"
                  value={characterForm.aliases}
                  onChange={(event) =>
                    setCharacterForm((prev) => ({
                      ...prev,
                      aliases: event.target.value,
                    }))
                  }
                  placeholder="Cat Burglar, Nami-san"
                />
              </AdminFormField>

              <div className="admin-character-dialog__field--wide admin-character-dialog__notes-grid">
                <AdminFormField
                  label="Summary"
                  hint="Short fanwiki-style opener for cards and previews."
                >
                  <textarea
                    className="admin-textarea admin-character-dialog__summary"
                    value={characterForm.summary}
                    onChange={(event) =>
                      setCharacterForm((prev) => ({
                        ...prev,
                        summary: event.target.value,
                      }))
                    }
                    placeholder="An iconic navigator known for weather combat, loyalty, and sharp instincts."
                  />
                </AdminFormField>

                <AdminFormField
                  label="Profile notes"
                  hint="Longer lore, traits, or background for your internal bank."
                >
                  <textarea
                    className="admin-textarea admin-character-dialog__profile"
                    value={characterForm.profile}
                    onChange={(event) =>
                      setCharacterForm((prev) => ({
                        ...prev,
                        profile: event.target.value,
                      }))
                    }
                    placeholder="Relationships, powers, character arc, personality beats, and canon references..."
                  />
                </AdminFormField>
              </div>

              <AdminFormField label="Sort order">
                <input
                  className="admin-input"
                  type="number"
                  value={characterForm.sortOrder}
                  onChange={(event) =>
                    setCharacterForm((prev) => ({
                      ...prev,
                      sortOrder: event.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </AdminFormField>

              <AdminFormField label="Visibility">
                <label className="admin-trend-dialog__toggle admin-inline-check">
                  <input
                    type="checkbox"
                    checked={characterForm.isActive}
                    onChange={(event) =>
                      setCharacterForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  <span>Active in character bank</span>
                </label>
              </AdminFormField>
            </div>
          </section>

          <aside className="admin-character-dialog__preview">
            <CharacterArtwork
              className="admin-character-dialog__preview-art"
              src={previewImage}
              alt={characterForm.name || "Character preview"}
            />

            <div className="admin-character-dialog__preview-copy">
              <span className="admin-trend-upload__eyebrow">Preview card</span>
              <h3>{characterForm.name.trim() || "Unnamed character"}</h3>
              <p>
                {characterForm.summary.trim() ||
                  "A short fanwiki-style summary will appear here once you add one."}
              </p>
            </div>

            <div className="admin-character-upload">
              <div className="admin-character-upload__copy">
                <span className="admin-trend-upload__eyebrow">Character portrait</span>
                <p className="admin-row-note">
                  Upload a clean portrait or wiki-style art for this reusable character profile.
                </p>
              </div>

              <label className="admin-trend-upload__button admin-character-upload__button">
                {composerUploading ? "Uploading..." : "Upload portrait"}
                <input
                  className="admin-trend-upload__input"
                  type="file"
                  accept="image/*"
                  onChange={handleCharacterImageChange}
                />
              </label>
            </div>

            <div className="admin-character-dialog__preview-meta">
              {previewWorld ? (
                <span className="admin-token">{getWorldName(previewWorld)}</span>
              ) : null}
              {characterForm.role.trim() ? (
                <span className="admin-token">{characterForm.role.trim()}</span>
              ) : null}
              <span
                className={`admin-pill ${
                  characterForm.isActive ? "admin-pill--success" : "admin-pill--warn"
                }`}
              >
                {characterForm.isActive ? "Active" : "Hidden"}
              </span>
            </div>

            {characterForm.aliases.trim() ? (
              <div className="admin-character-dialog__aliases">
                <span className="admin-trend-upload__eyebrow">Aliases</span>
                <p>{characterForm.aliases.trim()}</p>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="admin-dialog__footer">
          <Button variant="outline" onClick={closeComposerDialog}>
            Cancel
          </Button>
          <Button disabled={composerSaving || composerUploading} onClick={saveCharacter}>
            {composerSaving
              ? composerMode === "create"
                ? "Creating..."
                : "Saving..."
              : composerMode === "create"
                ? "Create character"
                : "Save character"}
          </Button>
        </div>
      </AdminDialog>

      <AdminDialog
        open={Boolean(imageDialogCharacter)}
        size="lg"
        title={imageDialogCharacter ? getName(imageDialogCharacter) : ""}
        subtitle={
          imageDialogCharacter
            ? `${getWorldNameFromCharacter(imageDialogCharacter)} • ${getRole(imageDialogCharacter)}`
            : ""
        }
        onClose={() => setImageDialogCharacter(null)}
      >
        {imageDialogCharacter ? (
          <div className="admin-character-image-dialog">
            <CharacterArtwork
              className="admin-character-image-dialog__art"
              src={resolveImageUrl(getImageUrl(imageDialogCharacter))}
              alt={getName(imageDialogCharacter)}
            />

            <div className="admin-character-image-dialog__meta">
              {getAliases(imageDialogCharacter) ? (
                <span className="admin-token">{getAliases(imageDialogCharacter)}</span>
              ) : null}
              <span className="admin-token">
                {getWorldNameFromCharacter(imageDialogCharacter)}
              </span>
              <span className="admin-token">{getRole(imageDialogCharacter)}</span>
            </div>

            <p className="admin-row-note">
              {getSummary(imageDialogCharacter) || "No summary added yet."}
            </p>
          </div>
        ) : null}
      </AdminDialog>

      <AdminDialog
        open={Boolean(linkedDialogCharacter)}
        size="xl"
        title={
          linkedDialogCharacter
            ? `Linked books for ${getName(linkedDialogCharacter)}`
            : ""
        }
        subtitle="Search your catalog, connect matching stories, and remove links whenever the world mapping changes."
        onClose={closeLinkedDialog}
      >
        <div className="admin-character-books-dialog">
          <section className="admin-trend-books-dialog__search">
            <div className="admin-trend-books-dialog__section-head">
              <h3 className="admin-panel__title">Find books to link</h3>
              <p className="admin-row-note">
                Search by book title or author, then attach the character to the right story world.
              </p>
            </div>

            <TextField
              className="admin-search-field"
              value={catalogSearch}
              onChange={setCatalogSearch}
              placeholder="Search title or author..."
            />

            {catalogErr ? (
              <p className="admin-character-inline-error">{catalogErr}</p>
            ) : null}

            <div className="admin-trend-books-dialog__catalog">
              {catalogLoading ? (
                <LoadingState text="Searching books..." />
              ) : catalogSearch.trim().length < 2 ? (
                <p className="admin-row-note">
                  Type at least 2 characters to search the catalog.
                </p>
              ) : visibleCatalogResults.length ? (
                <div className="admin-trend-books-dialog__catalog-list">
                  {visibleCatalogResults.map((book) => (
                    <article
                      key={book.id}
                      className="admin-trend-books-dialog__catalog-item"
                    >
                      <CharacterArtwork
                        className="admin-trend-books-dialog__catalog-art"
                        src={resolveImageUrl(book.coverImageUrl)}
                        alt={book.title}
                      />

                      <div className="admin-trend-books-dialog__catalog-copy">
                        <p className="admin-row-title admin-row-title--sm">
                          {book.title}
                        </p>
                        <p className="admin-row-note">
                          {book.authorName || "Unknown author"}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={linkingBookId === book.id}
                        onClick={() => linkBook(book.id)}
                      >
                        {linkingBookId === book.id ? "Linking..." : "Link book"}
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-row-note">
                  No matching books found, or every result is already linked.
                </p>
              )}
            </div>
          </section>

          <section className="admin-trend-books-dialog__linked">
            <div className="admin-trend-books-dialog__section-head">
              <h3 className="admin-panel__title">Connected books</h3>
              <p className="admin-row-note">
                These stories currently use this character template.
              </p>
            </div>

            <TextField
              className="admin-search-field"
              value={linkedBooksFilter}
              onChange={setLinkedBooksFilter}
              placeholder="Filter linked books..."
            />

            <div className="admin-trend-books-dialog__linked-list">
              {linkedBooksLoading ? (
                <LoadingState text="Loading linked books..." />
              ) : linkedBooksPageItems.length ? (
                <div className="admin-trend-books-dialog__linked-list">
                  {linkedBooksPageItems.map((book) => (
                    <article
                      key={book.id}
                      className="admin-trend-books-dialog__linked-item"
                    >
                      <CharacterArtwork
                        className="admin-trend-books-dialog__linked-art"
                        src={resolveImageUrl(book.coverImageUrl)}
                        alt={book.title}
                      />

                      <div className="admin-trend-books-dialog__linked-copy">
                        <p className="admin-row-title admin-row-title--sm">
                          {book.title}
                        </p>
                        <p className="admin-row-note">
                          {book.authorName || "Unknown author"}
                        </p>
                        {book.status ? (
                          <p className="admin-row-meta">
                            <span>Status:</span>
                            <strong>{book.status}</strong>
                          </p>
                        ) : null}
                      </div>

                      <Button
                        variant="danger"
                        size="sm"
                        disabled={unlinkingBookId === book.id}
                        onClick={() => unlinkBook(book.id)}
                      >
                        {unlinkingBookId === book.id ? "Removing..." : "Unlink"}
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-row-note">
                  No books are linked to this character yet.
                </p>
              )}
            </div>

            {linkedBooksPageCount > 1 ? (
              <div className="admin-trend-books-dialog__pagination">
                <span className="admin-row-note">
                  Page {linkedBooksPage} of {linkedBooksPageCount}
                </span>

                <div className="admin-pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={linkedBooksPage <= 1}
                    onClick={() => setLinkedBooksPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={linkedBooksPage >= linkedBooksPageCount}
                    onClick={() => setLinkedBooksPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </AdminDialog>
    </>
  );
}
