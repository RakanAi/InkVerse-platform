import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../../../Api/api";
import "./TableOfContent.css";

function toRoman(num) {
  if (num <= 0) return "";
  const map = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let result = "";
  let n = num;

  for (const [value, roman] of map) {
    while (n >= value) {
      result += roman;
      n -= value;
    }
  }
  return result;
}

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
};

const getChapterNumber = (chapter) =>
  Number(
    pick(chapter, "chapterNumber", "ChapterNumber", "number", "Number") ?? 0,
  ) || 0;

const getChapterId = (chapter) => pick(chapter, "id", "Id", "ID");

const normalizeChapters = (chapters) =>
  (Array.isArray(chapters) ? chapters : [])
    .slice()
    .sort((first, second) => getChapterNumber(first) - getChapterNumber(second));

const getSectionRangeLabel = (chapters) => {
  const list = normalizeChapters(chapters);
  if (!list.length) return null;

  const first = getChapterNumber(list[0]);
  const last = getChapterNumber(list[list.length - 1]);
  if (!first || !last) return null;
  if (first === last) return `Ch. ${first}`;
  return `Ch. ${first}-${last}`;
};

const getSectionDisplayName = (name) => {
  const raw = (name ?? "").trim();
  if (!raw) return "Loose chapters";
  if (raw.toLowerCase() === "no arc") return "Loose chapters";
  return raw;
};

function chunkByRange(chapters, step = 100) {
  const list = normalizeChapters(chapters);
  if (!list.length) return [];

  const maxNum = Math.max(...list.map((chapter) => getChapterNumber(chapter) || 0), 0);
  const usedStep = maxNum > 500 ? 250 : step;
  const map = new Map();

  for (const chapter of list) {
    const number = getChapterNumber(chapter) || 0;
    const safeNumber = Math.max(number, 1);
    const start = Math.floor((safeNumber - 1) / usedStep) * usedStep + 1;
    const end = start + usedStep - 1;
    const key = `${start}–${end}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(chapter);
  }

  const parseStart = (label) => Number(label.split("–")[0]) || 0;

  return Array.from(map.entries())
    .sort((first, second) => parseStart(first[0]) - parseStart(second[0]))
    .map(([rangeLabel, groupedChapters]) => ({
      name: `Chapters: ${rangeLabel}`,
      chapters: normalizeChapters(groupedChapters),
    }));
}

function splitArcIntoParts(arcName, chapters, limit = 100) {
  const list = normalizeChapters(chapters);
  if (!list.length) return [];

  if (list.length <= limit) {
    return [{ name: arcName, chapters: list }];
  }

  const parts = [];
  const totalParts = Math.ceil(list.length / limit);

  for (let index = 0; index < totalParts; index += 1) {
    const startIndex = index * limit;
    const endIndex = Math.min(startIndex + limit, list.length);
    const slice = list.slice(startIndex, endIndex);

    const firstNum = getChapterNumber(slice[0]) || startIndex + 1;
    const lastNum = getChapterNumber(slice[slice.length - 1]) || endIndex;

    parts.push({
      name: `${arcName} — Part ${toRoman(index + 1)}`,
      chapters: slice,
      rangeLabel: `${firstNum}–${lastNum}`,
    });
  }

  return parts;
}

function Toc() {
  const { id } = useParams();
  const [arcs, setArcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastReadNumber, setLastReadNumber] = useState(0);
  const [openSections, setOpenSections] = useState(["0"]);

  useEffect(() => {
    if (!id) return undefined;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/chapters/book/${id}/grouped`);
        const groupedChapters = Array.isArray(response.data) ? response.data : [];
        setArcs(groupedChapters);

        try {
          const progressRes = await api.get(`/books/${id}/reading-progress`);
          const data = progressRes.data || {};

          let chapterNumber =
            Number(
              data?.lastReadChapterNumber ?? data?.LastReadChapterNumber ?? 0,
            ) || 0;

          if (!chapterNumber) {
            const lastId =
              data?.lastReadChapterId ??
              data?.LastReadChapterId ??
              data?.chapterId ??
              data?.ChapterId ??
              null;

            if (lastId != null) {
              const allChapters = groupedChapters.flatMap((group) =>
                Array.isArray(group?.chapters) ? group.chapters : [],
              );
              const found = allChapters.find(
                (chapter) => String(getChapterId(chapter)) === String(lastId),
              );
              chapterNumber = found ? getChapterNumber(found) : 0;
            }
          }

          setLastReadNumber(chapterNumber);
        } catch (progressError) {
          console.warn(
            "Reading progress not available:",
            progressError?.response?.status,
            progressError?.response?.data || progressError?.message,
          );
          setLastReadNumber(0);
        }
      } catch (fetchError) {
        console.error(
          "Failed to fetch chapters:",
          fetchError.response || fetchError.message,
        );
        setError("Failed to load chapters.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    return undefined;
  }, [id]);

  const sections = useMemo(() => {
    const list = Array.isArray(arcs) ? arcs : [];
    if (!list.length) return [];

    const hasRealArc = list
      .filter((group) => (group?.arcName ?? "").trim())
      .some((group) => {
        const name = (group.arcName ?? "").trim().toLowerCase();
        return name && name !== "no arc" && name !== "null";
      });

    if (!hasRealArc) {
      const allChapters = list.flatMap((group) =>
        Array.isArray(group?.chapters) ? group.chapters : [],
      );
      return chunkByRange(allChapters, 100);
    }

    const output = [];
    for (const group of list) {
      const rawName = (group?.arcName ?? "").trim();
      const arcName =
        rawName && rawName.toLowerCase() !== "null" ? rawName : "No Arc";
      const chapters = Array.isArray(group?.chapters) ? group.chapters : [];

      if (arcName.toLowerCase() === "no arc") {
        output.push(...chunkByRange(chapters, 100));
      } else {
        output.push(...splitArcIntoParts(arcName, chapters, 100));
      }
    }

    return output;
  }, [arcs]);

  useEffect(() => {
    setOpenSections(sections.length ? ["0"] : []);
  }, [sections.length]);

  const toggleSection = (sectionKey) => {
    setOpenSections((current) =>
      current.includes(sectionKey)
        ? current.filter((item) => item !== sectionKey)
        : [...current, sectionKey],
    );
  };

  if (loading) {
    return <p className="iv-book-status">Loading Table of Contents...</p>;
  }

  if (error) {
    return <p className="iv-book-status iv-book-status--error">{error}</p>;
  }

  return (
    <section className="iv-book-section iv-book-section--plain iv-book-toc">
      <div className="iv-book-section__head">
        <div className="iv-book-section__title-wrap">
          <span className="borderStart" />
          <div>
            <h3 className="iv-book-section__title">Table of Contents</h3>
            <p className="iv-book-section__subtitle mb-0">
              Jump into the next chapter or revisit what you already read.
            </p>
          </div>
        </div>
      </div>

      <div className="iv-book-toc__groups">
        {sections.length > 0 ? (
          sections.map((section, index) => {
            const sectionKey = String(index);
            const isOpen = openSections.includes(sectionKey);
            const rangeLabel =
              section.rangeLabel ?? getSectionRangeLabel(section.chapters);
            const displayName = getSectionDisplayName(section.name);
            const sectionKind =
              displayName === "Loose chapters" ? "Chapter run" : "Story arc";

            return (
              <div
                className={`iv-book-toc__group ${isOpen ? "is-open" : ""}`}
                key={`${section.name}-${sectionKey}`}
              >
                <button
                  className="iv-book-toc__group-toggle"
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  aria-expanded={isOpen}
                >
                  <span className="iv-book-toc__group-label">
                    <small>{toRoman(index + 1)}</small>
                    <span className="iv-book-toc__group-copy">
                      <span className="iv-book-toc__group-kicker">
                        {sectionKind}
                      </span>
                      <strong>{displayName}</strong>
                      <em>
                        {section.chapters.length} chapter
                        {section.chapters.length === 1 ? "" : "s"}
                      </em>
                    </span>
                  </span>

                  <span className="iv-book-toc__group-meta">
                    {rangeLabel ? (
                      <span className="iv-book-toc__group-range">
                        {rangeLabel}
                      </span>
                    ) : null}

                    <i
                      className={`bi bi-chevron-down iv-book-toc__group-chevron ${
                        isOpen ? "is-open" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                <div
                  className={`iv-book-toc__collapse ${isOpen ? "is-open" : ""}`}
                  aria-hidden={!isOpen}
                >
                  <div className="iv-book-toc__body">
                    <div className="iv-book-toc__rows">
                      {section.chapters.map((chapter) => {
                        const chapterId = getChapterId(chapter);
                        const chapterNumber = getChapterNumber(chapter);
                        const isRead =
                          lastReadNumber > 0 &&
                          chapterNumber > 0 &&
                          chapterNumber <= lastReadNumber;

                        return (
                          <Link
                            className={`iv-book-toc__row ${isRead ? "is-read" : ""}`}
                            key={chapterId}
                            to={`/book/${id}/chapter/${chapterId}`}
                          >
                            <span className="iv-book-toc__index">
                              {String(chapterNumber || 0).padStart(2, "0")}
                            </span>
                            <span className="iv-book-toc__title">
                              {chapter.title || "Untitled chapter"}
                            </span>
                            <span className="iv-book-toc__state">
                              {chapter.isPaid || chapter.IsPaid ? "5 coins" : isRead ? "Read" : "Open"}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="iv-book-empty">No arcs or chapters available.</p>
        )}
      </div>
    </section>
  );
}

export default Toc;
