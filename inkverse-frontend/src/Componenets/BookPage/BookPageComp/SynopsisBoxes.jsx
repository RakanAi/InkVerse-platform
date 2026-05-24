import React from "react";
import { useTranslation } from "react-i18next";

export default function SynopsisBox({ description = "" }) {
  const { t } = useTranslation();

  return (
    <section className="iv-book-section iv-book-section--plain">
      <div className="iv-book-section__head">
        <div className="iv-book-section__title-wrap">
          <span className="borderStart" />
          <div>
            <h3 className="iv-book-section__title">{t("bookPage.synopsis.title")}</h3>
            <p className="iv-book-section__subtitle mb-0">
              {t("bookPage.synopsis.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="iv-book-copy">
        {description?.trim() || t("bookPage.synopsis.empty")}
      </div>
    </section>
  );
}
