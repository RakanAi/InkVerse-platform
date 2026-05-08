import { useEffect, useMemo, useState } from "react";
import api from "../../../Api/api";
import "./TopVersesBooks.css";

import LinkButton from "@/Shared/ui/LinkButton";
import HomeSection from "@/features/home/shared/HomeSection";
import TopBooksColumn from "@/features/home/topbooks/components/TopBooksColumn";

import {
  TOPBOOKS_LABELS,
  TOPBOOKS_TAKE,
  TOPBOOKS_VERSE_TYPES,
} from "@/features/home/topbooks/topbooks.presets";
import { buildTopByVerseEndpoint } from "@/features/home/topbooks/utils/buildTopByVerseEndpoint";
import { normalizeTopBooksResponse } from "@/features/home/topbooks/utils/normalizeTopBooksResponse";

export default function TopVersesBooks() {
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState(() => ({
    Original: [],
    AU: [],
    Fanfic: [],
  }));

  const endpoints = useMemo(() => {
    return TOPBOOKS_VERSE_TYPES.map((verseType) => ({
      ...verseType,
      endpoint: buildTopByVerseEndpoint({
        verseType: verseType.key,
        take: TOPBOOKS_TAKE,
      }),
    }));
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const results = await Promise.all(endpoints.map((entry) => api.get(entry.endpoint)));
        if (!alive) return;

        const nextLists = { Original: [], AU: [], Fanfic: [] };

        endpoints.forEach((entry, index) => {
          nextLists[entry.key] = normalizeTopBooksResponse(results[index]?.data);
        });

        setLists(nextLists);
      } catch (error) {
        console.error("Top lists failed", error);
        if (!alive) return;
        setLists({ Original: [], AU: [], Fanfic: [] });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [endpoints]);

  return (
    <HomeSection
      className="iv-home-topbooks"
      title={TOPBOOKS_LABELS.title}
      subtitle={TOPBOOKS_LABELS.subtitle}
      actions={
        <LinkButton to="/Browser" variant="outline" size="sm">
          Browse shelf
        </LinkButton>
      }
    >
      <div className="iv-top-grid">
        {TOPBOOKS_VERSE_TYPES.map((verseType) => (
          <TopBooksColumn
            key={verseType.key}
            title={verseType.title}
            items={lists[verseType.key]}
            loading={loading}
            ctaLabel={TOPBOOKS_LABELS.cta}
          />
        ))}
      </div>
    </HomeSection>
  );
}
