import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import AuthorMetricCard from "../../features/author/components/AuthorMetricCard";
import AuthorSectionHeading from "../../features/author/components/AuthorSectionHeading";
import {
  fetchAuthorEarnings,
  requestAuthorPayout,
} from "../../Api/monetization.api";
import "../../features/monetization/monetization.css";

function formatCoins(coins = 0) {
  return `$${(Number(coins || 0) / 100).toFixed(2)}`;
}

export default function AuthorIncome() {
  const { t } = useTranslation();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setEarnings(await fetchAuthorEarnings());
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t("author.studio.income.errors.load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitPayout = async (event) => {
    event.preventDefault();
    const amountCoins = Math.round(Number(payoutAmount || 0) * 100);
    if (!amountCoins) {
      setError(t("author.studio.income.errors.amount"));
      return;
    }

    setRequesting(true);
    setError("");
    try {
      await requestAuthorPayout(amountCoins);
      setPayoutAmount("");
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t("author.studio.income.errors.request"));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <LoadingState text={t("author.studio.income.loading")} />;
  if (error && !earnings) {
    return <ErrorState title={t("author.studio.income.unavailable")} subtitle={error} onRetry={load} />;
  }

  const royalties = Array.isArray(earnings?.royalties) ? earnings.royalties : [];
  const payouts = Array.isArray(earnings?.payoutRequests) ? earnings.payoutRequests : [];

  return (
    <div className="authorx-page">
      <section className="authorx-hero authorx-hero--compact">
        <div className="authorx-hero__copy">
          <span className="author-studio-eyebrow">{t("author.studio.income.eyebrow")}</span>
          <h1>{t("author.studio.income.title")}</h1>
          <p>{t("author.studio.income.subtitle")}</p>
        </div>
      </section>

      {error ? <div className="authorx-form-error mb-3">{error}</div> : null}

      <section className="authorx-kpi-grid">
        <AuthorMetricCard
          eyebrow={t("author.studio.income.available")}
          value={formatCoins(earnings?.availableCoins)}
          label={t("author.studio.income.withdrawable")}
          note={t("author.studio.income.coinsAvailable", { count: earnings?.availableCoins ?? 0 })}
        />
        <AuthorMetricCard
          eyebrow={t("author.studio.income.pending")}
          value={formatCoins(earnings?.pendingCoins)}
          label={t("author.studio.income.hold")}
          note={t("author.studio.income.pendingNote")}
        />
        <AuthorMetricCard
          eyebrow={t("author.studio.income.lifetime")}
          value={formatCoins(earnings?.lifetimeCoins)}
          label={t("author.studio.income.allRoyalties")}
          note={t("author.studio.income.beforeDeductions")}
        />
        <AuthorMetricCard
          eyebrow={t("author.studio.income.withdrawn")}
          value={formatCoins(earnings?.withdrawnCoins)}
          label={t("author.studio.income.requestedPayouts")}
          note={t("author.studio.income.payoutCount", { count: payouts.length, suffix: payouts.length === 1 ? "" : "s" })}
        />
      </section>

      <div className="authorx-grid-2">
        <Surface className="authorx-panel">
          <AuthorSectionHeading
            eyebrow={t("author.studio.income.payout")}
            title={t("author.studio.income.requestAnytime")}
            description={t("author.studio.income.payoutDescription")}
          />
          <form className="authorx-form" onSubmit={submitPayout}>
            <input
              className="authorx-native-select"
              type="number"
              min="0"
              step="0.01"
              value={payoutAmount}
              onChange={(event) => setPayoutAmount(event.target.value)}
              placeholder={t("author.studio.income.amountUsd")}
            />
            <Button type="submit" variant="primary" size="md" disabled={requesting}>
              {requesting ? t("author.studio.income.requesting") : t("author.studio.income.requestPayout")}
            </Button>
          </form>
        </Surface>

        <Surface className="authorx-panel">
          <AuthorSectionHeading
            eyebrow={t("author.studio.income.recentPayouts")}
            title={t("author.studio.income.payoutHistory")}
            description={t("author.studio.income.payoutHistoryDescription")}
          />
          {payouts.length ? (
            <div className="authorx-list">
              {payouts.map((payout) => (
                <div className="authorx-row" key={payout.id}>
                  <div>
                    <div className="authorx-row-title">{formatCoins(payout.amountCoins)}</div>
                    <div className="authorx-row-sub">{new Date(payout.requestedAt).toLocaleString()}</div>
                  </div>
                  <div className="authorx-row-metric">{payout.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("author.studio.income.noPayoutTitle")} subtitle={t("author.studio.income.noPayoutSubtitle")} />
          )}
        </Surface>
      </div>

      <Surface className="authorx-panel mt-3">
        <AuthorSectionHeading
          eyebrow={t("author.studio.income.royaltyLedger")}
          title={t("author.studio.income.bookRevenue")}
          description={t("author.studio.income.bookRevenueDescription")}
        />
        {royalties.length ? (
          <div className="authorx-list">
            {royalties.map((entry) => (
              <div className="authorx-row" key={entry.id}>
                <div>
                  <div className="authorx-row-title">{entry.entryType.replaceAll("_", " ")}</div>
                  <div className="authorx-row-sub">
                    {t("author.studio.income.entryBook", { bookId: entry.bookId })}
                    {entry.chapterId ? t("author.studio.income.entryChapter", { chapterId: entry.chapterId }) : ""} · {t("author.studio.income.entryAvailable", { date: new Date(entry.availableAt).toLocaleDateString() })}
                  </div>
                </div>
                <div className="authorx-row-metric">
                  {formatCoins(entry.authorCoins)} · {entry.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t("author.studio.income.noRoyaltiesTitle")} subtitle={t("author.studio.income.noRoyaltiesSubtitle")} />
        )}
      </Surface>
    </div>
  );
}
