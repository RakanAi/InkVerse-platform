import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AuthorSectionHeading from "../../features/author/components/AuthorSectionHeading";
import {
  acceptAuthorAgreement,
  fetchAuthorAgreement,
} from "../../Api/monetization.api";

export default function AuthorContract() {
  const { t } = useTranslation();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAgreement(await fetchAuthorAgreement());
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.contract.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async () => {
    setAccepting(true);
    setError("");
    try {
      setAgreement(await acceptAuthorAgreement());
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.contract.acceptError"));
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <LoadingState text={t("author.studio.contract.loading")} />;
  if (error && !agreement) return <ErrorState title={t("author.studio.contract.unavailable")} subtitle={error} onRetry={load} />;

  return (
    <div className="authorx-page">
      <section className="authorx-hero authorx-hero--compact">
        <div className="authorx-hero__copy">
          <span className="author-studio-eyebrow">{t("author.studio.contract.eyebrow")}</span>
          <h1>{t("author.studio.contract.title")}</h1>
          <p>{t("author.studio.contract.subtitle")}</p>
        </div>
      </section>

      {error ? <div className="authorx-form-error mb-3">{error}</div> : null}

      <div className="authorx-grid-2 authorx-grid-2--contract">
        <Surface className="authorx-panel">
          <AuthorSectionHeading
            eyebrow={t("author.studio.contract.status")}
            title={t("author.studio.contract.currentState")}
            description={t("author.studio.contract.stateDescription")}
          />
          <div className={`authorx-contract-status ${agreement?.hasAccepted ? "success" : ""}`}>
            {agreement?.hasAccepted ? t("author.studio.contract.accepted") : t("author.studio.contract.notAccepted")}
          </div>
          {agreement?.acceptedAt ? (
            <p className="authorx-contract-note">
              {t("author.studio.contract.acceptedAt", { date: new Date(agreement.acceptedAt).toLocaleString() })}
            </p>
          ) : (
            <Button type="button" variant="primary" size="md" onClick={accept} disabled={accepting}>
              {accepting ? t("author.studio.contract.accepting") : t("author.studio.contract.acceptAgreement")}
            </Button>
          )}
        </Surface>

        <Surface className="authorx-panel">
          <AuthorSectionHeading
            eyebrow={agreement?.version || t("author.studio.contract.versionFallback")}
            title={agreement?.title || t("author.studio.contract.agreementTitle")}
            description={t("author.studio.contract.legalReview")}
          />
          <div className="authorx-contract-list">
            <article>
              <strong>{t("author.studio.contract.royaltySplit")}</strong>
              <span>{t("author.studio.contract.royaltySplitText")}</span>
            </article>
            <article>
              <strong>{t("author.studio.contract.holdPeriod")}</strong>
              <span>{t("author.studio.contract.holdPeriodText")}</span>
            </article>
            <article>
              <strong>{t("author.studio.contract.readerAi")}</strong>
              <span>{t("author.studio.contract.readerAiText")}</span>
            </article>
          </div>
          <p className="authorx-contract-note">{agreement?.body}</p>
        </Surface>
      </div>
    </div>
  );
}
