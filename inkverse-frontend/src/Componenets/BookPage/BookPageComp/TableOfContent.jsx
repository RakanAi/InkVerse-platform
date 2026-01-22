import Accordion from "react-bootstrap/Accordion";
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
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
};

const getChapterNumber = (c) =>
  Number(pick(c, "chapterNumber", "ChapterNumber", "number", "Number") ?? 0) ||
  0;

const getChapterId = (c) => pick(c, "id", "Id", "ID");

const normalizeChapters = (chapters) =>
  (Array.isArray(chapters) ? chapters : [])
    .slice()
    .sort((a, b) => getChapterNumber(a) - getChapterNumber(b));

function chunkByRange(chapters, step = 100) {
  const list = normalizeChapters(chapters);
  if (!list.length) return [];

  const maxNum = Math.max(...list.map((c) => getChapterNumber(c) || 0), 0);
  const usedStep = maxNum > 500 ? 250 : step;

  const map = new Map();

  for (const c of list) {
    const n = getChapterNumber(c) || 0;
    const safeN = Math.max(n, 1);
    const start = Math.floor((safeN - 1) / usedStep) * usedStep + 1;
    const end = start + usedStep - 1;
    const key = `${start}–${end}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  }

  const parseStart = (label) => Number(label.split("–")[0]) || 0;

  return Array.from(map.entries())
    .sort((a, b) => parseStart(a[0]) - parseStart(b[0]))
    .map(([rangeLabel, chs]) => ({
      name: `Chapters: ${rangeLabel}`,
      chapters: normalizeChapters(chs),
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

  for (let i = 0; i < totalParts; i++) {
    const startIndex = i * limit;
    const endIndex = Math.min(startIndex + limit, list.length);
    const slice = list.slice(startIndex, endIndex);

    const firstNum = getChapterNumber(slice[0]) || startIndex + 1;
    const lastNum = getChapterNumber(slice[slice.length - 1]) || endIndex;

    const partLabel = `Part ${toRoman(i + 1)}`;
    parts.push({
      name: `${arcName} — ${partLabel} (${firstNum}–${lastNum})`,
      chapters: slice,
    });
  }

  return parts;
}

function Toc() {
  const { id } = useParams();
  const [arcs, setArcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ NEW: last read chapter number (used to mute)
  const [lastReadNumber, setLastReadNumber] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) chapters grouped
        const response = await api.get(`/chapters/book/${id}/grouped`);
        setArcs(Array.isArray(response.data) ? response.data : []);

        // 2) reading progress (optional)
        // 2) reading progress (optional)
        try {
          const progRes = await api.get(`/books/${id}/reading-progress`);
          const data = progRes.data || {};

          // Case A: API returns lastReadChapterNumber
          let n =
            Number(
              data?.lastReadChapterNumber ?? data?.LastReadChapterNumber ?? 0,
            ) || 0;

          // Case B: API returns lastReadChapterId (convert to number using chapters list)
          if (!n) {
            const lastId =
              data?.lastReadChapterId ??
              data?.LastReadChapterId ??
              data?.chapterId ??
              data?.ChapterId ??
              null;

            if (lastId != null) {
              // Build a flat list of all chapters we already fetched
              const allChapters = (
                Array.isArray(response.data) ? response.data : []
              ).flatMap((a) => (Array.isArray(a?.chapters) ? a.chapters : []));

              const found = allChapters.find(
                (c) => String(getChapterId(c)) === String(lastId),
              );
              n = found ? getChapterNumber(found) : 0;
            }
          }

          setLastReadNumber(n);
        } catch (e) {
          // IMPORTANT: log why it failed so you can see if it's 401/404
          console.warn(
            "Reading progress not available:",
            e?.response?.status,
            e?.response?.data || e?.message,
          );
          setLastReadNumber(0);
        }
      } catch (err) {
        console.error("Failed to fetch chapters:", err.response || err.message);
        setError("Failed to load chapters.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const sections = useMemo(() => {
    const list = Array.isArray(arcs) ? arcs : [];
    if (!list.length) return [];

    const hasRealArc = list
      .filter((a) => (a?.arcName ?? "").trim())
      .some((a) => {
        const n = (a.arcName ?? "").trim().toLowerCase();
        return n && n !== "no arc" && n !== "null";
      });

    if (!hasRealArc) {
      const allChapters = list.flatMap((a) =>
        Array.isArray(a?.chapters) ? a.chapters : [],
      );
      return chunkByRange(allChapters, 100);
    }

    const out = [];
    for (const a of list) {
      const rawName = (a?.arcName ?? "").trim();
      const arcName =
        rawName && rawName.toLowerCase() !== "null" ? rawName : "No Arc";

      const chs = Array.isArray(a?.chapters) ? a.chapters : [];

      if (arcName.toLowerCase() === "no arc") {
        out.push(...chunkByRange(chs, 100));
      } else {
        out.push(...splitArcIntoParts(arcName, chs, 100));
      }
    }
    return out;
  }, [arcs]);

  if (loading) return <p>Loading Table of Contents...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="row mx-0 mt-2 col-12">
      <div className="d-flex ">
        <h2 className="borderStart "></h2>
        <h3 className="">Table Of Contents</h3>
      </div>

      <Accordion defaultActiveKey={["0"]} alwaysOpen>
        {sections.length > 0 ? (
          sections.map((sec, index) => (
            <Accordion.Item
              className="border-0 bg-none "
              eventKey={index.toString()}
              key={`${sec.name}-${index}`}
            >
              <Accordion.Header>
                {toRoman(index + 1)}. {sec.name}
              </Accordion.Header>

              <Accordion.Body>
                <div className="row gap-2">
                  {sec.chapters.map((chapter) => {
                    const chNum = getChapterNumber(chapter);
                    const isRead =
                      lastReadNumber > 0 &&
                      chNum > 0 &&
                      chNum <= lastReadNumber;

                    return (
                      <div
                        className={`col-12 d-flex pt-2 border contentHover rounded text-start text-decoration-none ${
                          isRead ? "opacity-75" : ""
                        }`}
                        key={chapter.id}
                      >
                        <h2
                          className={
                            isRead ? "borderStart-read" : "borderStart"
                          }
                        ></h2>

                        <Link
                          to={`/book/${id}/chapter/${chapter.id}`}
                          className={isRead ? "text-muted" : ""}
                          style={{ textDecoration: "none" }}
                        >
                          {chapter.title}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))
        ) : (
          <p className="text-center text-muted my-3">
            No arcs or chapters available.
          </p>
        )}
      </Accordion>
    </div>
  );
}

export default Toc;
