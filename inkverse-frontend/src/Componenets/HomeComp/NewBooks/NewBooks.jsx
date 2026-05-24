import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./NewBooks.css";

import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import Button from "@/Shared/ui/Button";
import LinkButton from "@/Shared/ui/LinkButton";
import HomeSection from "@/features/home/shared/HomeSection";
import useHomeCollection from "@/features/home/shared/useHomeCollection";
import NewBookTile from "@/features/home/newbooks/components/NewBookTile";

import {
  NEWBOOKS_QUERY,
  NEWBOOKS_VISIBLE_BY_WIDTH,
  getNewBooksLabels,
} from "@/features/home/newbooks/newbooks.presets";
import { getVisibleCount } from "@/features/home/newbooks/getVisibleCount";
import { buildBooksQuery } from "@/features/home/newbooks/utils/buildBooksQuery";
import { getCollectionItems } from "@/features/home/shared/home.models";

export default function NewBooks() {
  const { t } = useTranslation();
  const labels = getNewBooksLabels(t);
  const [visibleBooks, setVisibleBooks] = useState(6);
  const endpoint = buildBooksQuery(NEWBOOKS_QUERY);
  const { items: books, loading, error, refetch } = useHomeCollection({
    endpoint,
    errorMessage: labels.error,
    selectItems: getCollectionItems,
  });

  useEffect(() => {
    const updateVisibleBooks = () => {
      setVisibleBooks(getVisibleCount(window.innerWidth, NEWBOOKS_VISIBLE_BY_WIDTH));
    };

    updateVisibleBooks();
    window.addEventListener("resize", updateVisibleBooks);

    return () => window.removeEventListener("resize", updateVisibleBooks);
  }, []);

  return (
    <HomeSection
      className="iv-home-latest"
      title={labels.title}
      subtitle={labels.subtitle}
      actions={
        <LinkButton to="/Browser" variant="primary" size="sm">
          {labels.cta}
        </LinkButton>
      }
    >
      {loading ? (
        <LoadingState text={labels.loading} />
      ) : error ? (
        <div className="d-flex flex-column gap-2">
          <ErrorState title={error} />
          <div>
            <Button variant="outline" onClick={refetch}>
              {t("common.actions.retry")}
            </Button>
          </div>
        </div>
      ) : books.length === 0 ? (
        <EmptyState title={labels.empty} />
      ) : (
        <div className="iv-books-row">
          {books.slice(0, visibleBooks).map((book) => (
            <NewBookTile key={book.id ?? book.Id} book={book} />
          ))}
        </div>
      )}
    </HomeSection>
  );
}
