import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../Api/api";
import "./TopVersesBooks.css";

import LinkButton from "@/Shared/ui/LinkButton";
import HomeSection from "@/features/home/shared/HomeSection";
import TopBooksColumn from "@/features/home/topbooks/components/TopBooksColumn";

import {
  TOPBOOKS_TAKE,
  getTopBooksLabels,
  getTopBooksVerseTypes,
} from "@/features/home/topbooks/topbooks.presets";
import { buildTopByVerseEndpoint } from "@/features/home/topbooks/utils/buildTopByVerseEndpoint";
import { normalizeTopBooksResponse } from "@/features/home/topbooks/utils/normalizeTopBooksResponse";

export default function TopVersesBooks() {
  const { t } = useTranslation();
  const labels = getTopBooksLabels(t);
  const verseTypes = useMemo(() => getTopBooksVerseTypes(t), [t]);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState(() => ({
    Original: [],
    AU: [],
    Fanfic: [],
  }));

  const endpoints = useMemo(() => {
    return verseTypes.map((verseType) => ({
      ...verseType,
      endpoint: buildTopByVerseEndpoint({
        verseType: verseType.key,
        take: TOPBOOKS_TAKE,
      }),
    }));
  }, [verseTypes]);

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
      title={labels.title}
      subtitle={labels.subtitle}
      actions={
        <LinkButton to="/Browser" variant="outline" size="sm">
          {labels.browseShelf}
        </LinkButton>
      }
    >
      <div className="iv-top-grid">
        {verseTypes.map((verseType) => (
          <TopBooksColumn
            key={verseType.key}
            title={verseType.title}
            items={lists[verseType.key]}
            loading={loading}
            ctaLabel={labels.cta}
          />
        ))}
      </div>
    </HomeSection>
  );
}
