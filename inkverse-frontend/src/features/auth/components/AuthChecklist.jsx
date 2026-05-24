import { useTranslation } from "react-i18next";

export default function AuthChecklist({ sections, completed, total, percent }) {
  const { t } = useTranslation();

  return (
    <div className="iv-auth-checklist">
      <div className="iv-auth-progressHead">
        <div>
          <p className="iv-auth-progressLabel">{t("auth.register.checklist.progressLabel")}</p>
          <p className="iv-auth-progressCopy">
            {t("auth.register.checklist.progressCopy", { completed, total })}
          </p>
        </div>
        <strong className="iv-auth-progressValue">{percent}%</strong>
      </div>

      <div className="iv-auth-progressTrack" aria-hidden="true">
        <span className="iv-auth-progressFill" style={{ width: `${percent}%` }} />
      </div>

      <div className="iv-auth-ruleSections">
        {sections.map((section) => (
          <section key={section.title} className="iv-auth-ruleSection">
            <h3 className="iv-auth-ruleSection__title">{section.title}</h3>
            <ul className="iv-auth-ruleList">
              {section.items.map((item) => (
                <li
                  key={item.label}
                  className={`iv-auth-rule${item.passed ? " is-pass" : ""}`}
                >
                  <span className="iv-auth-rule__dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
