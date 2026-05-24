import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Api/api";
import LoadingState from "../Shared/ui/LoadingState";
import ErrorState from "../Shared/ui/ErrorState";
import "./AchievementsPage.css";

const TIER_ORDER = ["Bronze", "Silver", "Gold", "Diamond"];

const TIER_COPY = {
  Bronze: "First spark",
  Silver: "Steady habit",
  Gold: "True devotion",
  Diamond: "Lorekeeper",
};

const FAMILY_ORDER = [
  "Last Page",
  "First Pages",
  "Chapter Trail",
  "Daily Flame",
  "Conversation Starter",
  "Shelf Builder",
  "Reviewer",
];

const FAMILY_META_BY_METRIC = {
  books_completed: {
    family: "Last Page",
    asset: "noa-last-page",
    icon: "bi-bookmark-check",
    note: "Finish books with every current chapter counted.",
  },
  books_started: {
    family: "First Pages",
    asset: "noa-first-pages",
    icon: "bi-book",
    note: "Begin new stories and let the first chapter count.",
  },
  chapters_read: {
    family: "Chapter Trail",
    asset: "noa-chapter-trail",
    icon: "bi-signpost-split",
    note: "Build a trail through unique counted chapters.",
  },
  daily_read_streak: {
    family: "Daily Flame",
    asset: "noa-daily-flame",
    icon: "bi-fire",
    note: "Keep returning on local reading days.",
  },
  comments_posted: {
    family: "Conversation Starter",
    asset: "noa-conversation-starter",
    icon: "bi-chat-dots",
    note: "Leave comments and replies in the margins.",
  },
  library_saves: {
    family: "Shelf Builder",
    asset: "noa-shelf-builder",
    icon: "bi-journal-bookmark",
    note: "Save books into your reader library.",
  },
  reviews_posted: {
    family: "Reviewer",
    asset: "noa-reviewer",
    icon: "bi-star",
    note: "Write reviews that help other readers choose.",
  },
};

const FAMILY_META_BY_NAME = Object.values(FAMILY_META_BY_METRIC).reduce((acc, item) => {
  acc[item.family] = item;
  return acc;
}, {});

function normalizeAchievement(item) {
  return {
    key: item?.key ?? item?.Key ?? "",
    title: item?.title ?? item?.Title ?? "Achievement",
    description: item?.description ?? item?.Description ?? "",
    category: item?.category ?? item?.Category ?? "Reading",
    tier: item?.tier ?? item?.Tier ?? "Bronze",
    threshold: item?.threshold ?? item?.Threshold ?? 0,
    metricType: item?.metricType ?? item?.MetricType ?? "",
    isUnlocked: item?.isUnlocked ?? item?.IsUnlocked ?? false,
    currentProgress: item?.currentProgress ?? item?.CurrentProgress ?? 0,
    progressPercent: item?.progressPercent ?? item?.ProgressPercent ?? 0,
    unlockedAt: item?.unlockedAt ?? item?.UnlockedAt ?? null,
  };
}

function tierIndex(tier) {
  const index = TIER_ORDER.indexOf(tier);
  return index === -1 ? 0 : index;
}

function familyIndex(family) {
  const index = FAMILY_ORDER.indexOf(family);
  return index === -1 ? FAMILY_ORDER.length : index;
}

function formatMetricName(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFamilyName(achievement) {
  const title = String(achievement.title || "");
  const baseTitle = title.includes(":") ? title.split(":")[0].trim() : title.trim();
  return (
    FAMILY_META_BY_METRIC[achievement.metricType]?.family ||
    baseTitle ||
    formatMetricName(achievement.metricType)
  );
}

function getFamilyMeta(achievement) {
  const family = getFamilyName(achievement);
  return (
    FAMILY_META_BY_METRIC[achievement.metricType] ||
    FAMILY_META_BY_NAME[family] || {
      family,
      asset: "",
      icon: "bi-patch-check",
      note: achievement.description || formatMetricName(achievement.metricType),
    }
  );
}

function cleanDescription(description, threshold) {
  const text = String(description || "").trim();
  const thresholdText = Number(threshold || 0).toLocaleString();
  return text
    .replace(new RegExp(`:\\s*${thresholdText.replace(",", "\\\\,")}\\.?$`), ".")
    .replace(/:\s*[\d,]+\.?$/, ".")
    .trim();
}

function groupAchievementFamilies(achievements) {
  const familyMap = achievements.reduce((acc, achievement) => {
    const category = achievement.category || "Reading";
    const meta = getFamilyMeta(achievement);
    const key = `${category}:${achievement.metricType || meta.family}`;

    if (!acc[key]) {
      acc[key] = {
        key,
        category,
        family: meta.family,
        meta,
        metricType: achievement.metricType,
        items: [],
      };
    }

    acc[key].items.push(achievement);
    return acc;
  }, {});

  return Object.values(familyMap).map((family) => {
    const items = [...family.items].sort((a, b) => tierIndex(a.tier) - tierIndex(b.tier));
    const unlockedItems = items.filter((item) => item.isUnlocked);
    const currentProgress = Math.max(0, ...items.map((item) => Number(item.currentProgress || 0)));
    const highestUnlocked = unlockedItems[unlockedItems.length - 1] || null;
    const nextLocked = items.find((item) => !item.isUnlocked) || null;
    const focusItem = nextLocked || items[items.length - 1] || null;
    const target = Number(focusItem?.threshold || 0);
    const percent = target
      ? Math.min(100, Math.round((currentProgress / target) * 100))
      : Number(focusItem?.progressPercent || 0);
    const displayTier = highestUnlocked?.tier || focusItem?.tier || "Bronze";
    const isMaxed = items.length > 0 && items.every((item) => item.isUnlocked);
    const descriptionSource = focusItem || items[0] || {};

    return {
      ...family,
      items,
      unlockedItems,
      currentProgress,
      highestUnlocked,
      nextLocked,
      focusItem,
      target,
      percent,
      displayTier,
      isMaxed,
      description:
        cleanDescription(descriptionSource.description, descriptionSource.threshold) ||
        family.meta.note ||
        formatMetricName(family.metricType),
    };
  });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NoaBadge({ meta, locked }) {
  const [hasImage, setHasImage] = useState(Boolean(meta.asset));
  const src = meta.asset ? `/assets/noa/achievements/${meta.asset}.png` : "";

  return (
    <div
      className={`achievement-noa-badge ${locked ? "is-locked" : "is-lit"} ${
        hasImage ? "" : "is-fallback"
      }`}
      aria-hidden="true"
    >
      {hasImage ? (
        <img src={src} alt="" loading="lazy" onError={() => setHasImage(false)} />
      ) : (
        <i className={`bi ${meta.icon || "bi-patch-check"}`} />
      )}
      {locked ? (
        <span className="achievement-noa-badge__lock">
          <i className="bi bi-lock" />
        </span>
      ) : null}
    </div>
  );
}

function TierStrip() {
  return (
    <section className="achievements-tier-strip" aria-label="Achievement tiers">
      <div className="achievements-tier-strip__intro">
        <span>Tier System</span>
        <strong>Four ranks of reader mastery</strong>
      </div>
      {TIER_ORDER.map((tier) => (
        <div key={tier} className={`achievements-tier-swatch achievements-tier-swatch--${tier.toLowerCase()}`}>
          <span className="achievements-tier-swatch__gem" />
          <div>
            <strong>{tier}</strong>
            <small>{TIER_COPY[tier]}</small>
          </div>
        </div>
      ))}
    </section>
  );
}

function AchievementFamilyCard({ family }) {
  const isLocked = !family.highestUnlocked;
  const tierClass = String(family.displayTier || "Bronze").toLowerCase();
  const cappedProgress = family.target
    ? Math.min(family.currentProgress, family.target)
    : family.currentProgress;
  const latestUnlockDate = family.unlockedItems
    .map((item) => item.unlockedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <article
      className={`achievement-family-card achievement-family-card--${tierClass} ${
        isLocked ? "is-locked" : "is-unlocked"
      }`}
    >
      <div className="achievement-family-card__shine" aria-hidden="true" />
      <div className="achievement-family-card__top">
        <NoaBadge meta={family.meta} locked={isLocked} />
        <div className="achievement-family-card__title">
          <span>{family.category}</span>
          <h3>{family.family}</h3>
          <p>{family.description}</p>
        </div>
      </div>

      <div className="achievement-family-card__status">
        <span className="achievement-family-card__ribbon">
          <span />
          {isLocked
            ? `${family.focusItem?.tier || "Bronze"} pending`
            : `${family.highestUnlocked.tier} unlocked`}
        </span>
        <small>
          {family.isMaxed
            ? "All tiers complete"
            : `Next: ${family.focusItem?.tier || "Bronze"} at ${Number(
                family.target || 0,
              ).toLocaleString()}`}
        </small>
      </div>

      <div className="achievement-family-progress">
        <div className="achievement-family-progress__meta">
          <strong>
            {cappedProgress.toLocaleString()} / {Number(family.target || 0).toLocaleString()}
          </strong>
          <span>{family.percent}%</span>
        </div>
        <div className="achievement-family-progress__bar" aria-hidden="true">
          <span style={{ width: `${family.percent}%` }} />
        </div>
      </div>

      <div className="achievement-tier-milestones" aria-label={`${family.family} tier progress`}>
        {family.items.map((item) => {
          const itemTierClass = String(item.tier || "Bronze").toLowerCase();
          return (
            <div
              key={item.key}
              className={`achievement-tier-milestone achievement-tier-milestone--${itemTierClass} ${
                item.isUnlocked ? "is-unlocked" : "is-locked"
              }`}
            >
              <span className="achievement-tier-milestone__dot" />
              <div>
                <strong>{item.tier}</strong>
                <small>{Number(item.threshold || 0).toLocaleString()}</small>
              </div>
              <i className={`bi ${item.isUnlocked ? "bi-check2" : "bi-lock"}`} />
            </div>
          );
        })}
      </div>

      {latestUnlockDate ? (
        <p className="achievement-family-card__earned">Last earned {formatDate(latestUnlockDate)}</p>
      ) : (
        <p className="achievement-family-card__earned">Locked until the first milestone is reached.</p>
      )}
    </article>
  );
}

export default function AchievementsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/me/achievements");
      setData(response.data);
    } catch (err) {
      console.error("load achievements failed:", err);
      setError(err?.response?.data?.message || "Could not load achievements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const progress = data?.progress ?? data?.Progress ?? {};
  const achievements = useMemo(
    () =>
      Array.isArray(data?.achievements ?? data?.Achievements)
        ? (data?.achievements ?? data?.Achievements).map(normalizeAchievement)
        : [],
    [data],
  );

  const familiesByCategory = useMemo(() => {
    const families = groupAchievementFamilies(achievements);
    return families.reduce((acc, family) => {
      acc[family.category] = acc[family.category] || [];
      acc[family.category].push(family);
      return acc;
    }, {});
  }, [achievements]);

  const level = progress?.level ?? progress?.Level ?? 1;
  const currentLevelProgress =
    progress?.currentLevelProgress ?? progress?.CurrentLevelProgress ?? 0;
  const nextLevelRequirement =
    progress?.nextLevelRequirement ?? progress?.NextLevelRequirement ?? 100;
  const totalRead =
    progress?.totalUniqueChaptersRead ?? progress?.TotalUniqueChaptersRead ?? 0;
  const dailyStreak = progress?.dailyReadStreak ?? progress?.DailyReadStreak ?? 0;
  const longestStreak = progress?.longestStreak ?? progress?.LongestStreak ?? 0;
  const levelPercent = nextLevelRequirement
    ? Math.min(100, Math.round((currentLevelProgress / nextLevelRequirement) * 100))
    : 0;
  const unlockedCount = achievements.filter((item) => item.isUnlocked).length;

  if (loading) {
    return (
      <main className="achievements-page">
        <LoadingState text="Loading achievements..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="achievements-page">
        <ErrorState title="Achievements unavailable" subtitle={error} onRetry={loadAchievements} />
      </main>
    );
  }

  return (
    <main className="achievements-page">
      <section className="achievements-hero">
        <div className="achievements-hero__copy">
          <Link to="/profilePage" className="achievements-backlink">
            <i className="bi bi-arrow-left" />
            <span>Profile</span>
          </Link>
          <p className="achievements-kicker">Reader Progress</p>
          <h1>Your Inkbound journey</h1>
          <p>
            Noa keeps a private record of your counted chapters, streaks, reviews,
            comments, and saved books. These badges are cosmetic, but they make your
            reader profile feel alive.
          </p>
        </div>

        <aside className="achievements-level-panel" aria-label="Reader level progress">
          <div className="achievements-level-panel__row">
            <span>Level {level}</span>
            <strong>Level {Number(level) + 1}</strong>
          </div>
          <div className="achievement-family-progress__bar" aria-hidden="true">
            <span style={{ width: `${levelPercent}%` }} />
          </div>
          <p>
            {currentLevelProgress.toLocaleString()} of{" "}
            {nextLevelRequirement.toLocaleString()} chapters toward the next level.
            Leveling up updates your public reader rank and badge presence.
          </p>
        </aside>
      </section>

      <section className="achievements-stats" aria-label="Reader achievement summary">
        <article>
          <span>Unlocked</span>
          <strong>{unlockedCount}</strong>
          <small>of {achievements.length} tier badges</small>
        </article>
        <article>
          <span>Chapters</span>
          <strong>{Number(totalRead || 0).toLocaleString()}</strong>
          <small>unique reads counted</small>
        </article>
        <article>
          <span>Daily Streak</span>
          <strong>{Number(dailyStreak || 0).toLocaleString()}</strong>
          <small>longest {Number(longestStreak || 0).toLocaleString()} days</small>
        </article>
      </section>

      <TierStrip />

      {["Reading", "Social"].map((category) => {
        const families = familiesByCategory[category] || [];
        const categoryAchievements = achievements.filter((item) => item.category === category);
        const categoryUnlocked = categoryAchievements.filter((item) => item.isUnlocked).length;

        if (!families.length) return null;

        return (
          <section key={category} className="achievements-section">
            <div className="achievements-section-head">
              <div>
                <p className="achievements-kicker">{category}</p>
                <h2>{category} milestones</h2>
              </div>
              <div className="achievements-section-head__meta">
                <span>{families.length} families</span>
                <strong>
                  {categoryUnlocked} / {categoryAchievements.length} unlocked
                </strong>
              </div>
            </div>

            <div className="achievements-grid">
              {families
                .sort((a, b) => familyIndex(a.family) - familyIndex(b.family))
                .map((family) => (
                  <AchievementFamilyCard key={family.key} family={family} />
                ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
