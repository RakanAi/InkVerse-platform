import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./TagSec.css";
import api from "../../../Api/api";

import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";

import {
  TOPTAGS_MAX_WIDTH,
  TOPTAGS_QUERY,
  TOPTAGS_LABELS,
} from "@/features/home/toptags/toptags.presets";
import { buildPopularTagsEndpoint } from "@/features/home/toptags/utils/buildPopularTagsEndpoint";
import { getTagName } from "@/features/home/toptags/utils/getTagName";
import PageHeader from "@/Shared/ui/PageHeader";

export default function TopTags() {
  const [bookTags, setBookTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoint = useMemo(() => buildPopularTagsEndpoint(TOPTAGS_QUERY), []);

  const fetchTags = useCallback(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(endpoint);
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data?.items ?? []);

        if (alive) setBookTags(list);
      } catch (e) {
        console.error(e);
        if (alive) {
          setBookTags([]);
          setError("Failed to load tags.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [endpoint]);

  useEffect(() => {
    const cleanup = fetchTags();
    return cleanup;
  }, [fetchTags]);

  return (
    <div style={{ maxWidth: `${TOPTAGS_MAX_WIDTH}px`, margin: "auto" }}>
      <div className="d-flex">
        <h2 className="borderStart mt-2"></h2>
        <p className="mt-4 ms-2 text-start">
          <PageHeader
            title={TOPTAGS_LABELS.title}
            subtitle={TOPTAGS_LABELS.subtitle}
          />{" "}
        </p>
      </div>

      <div
        className="row cardd d-flex"
        style={{ maxWidth: `${TOPTAGS_MAX_WIDTH}px`, margin: "auto" }}
      >
        <div className="container d-flex">
          <span className="shadow__btn mx-1 justify-content-between align-items-center d-flex ms-auto fluid">
            {TOPTAGS_LABELS.badge}
          </span>

          <div className="d-flex flex-wrap gap-2">
            {loading ? (
              <LoadingState text="Loading tags..." />
            ) : error ? (
              <ErrorState
                title={error}
                subtitle="Please try again."
                onRetry={() => fetchTags()}
              />
            ) : !bookTags?.length ? (
              <EmptyState title="No tags yet." subtitle={null} />
            ) : (
              bookTags.map((tag, index) => {
                const name = getTagName(tag);
                if (!name) return null;

                return (
                  <Link
                    key={tag.id ?? tag.ID ?? index}
                    to={`/Browser?tag=${encodeURIComponent(name)}`}
                    className="btn btn-outline-primary btn-sm rounded-pill"
                  >
                    #{name}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
