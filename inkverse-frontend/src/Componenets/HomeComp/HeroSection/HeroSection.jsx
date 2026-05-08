import LinkButton from "@/Shared/ui/LinkButton";
import heroArt from "../../../assets/BackGround_04.png";
import { HOME_HERO_CONTENT } from "@/features/home/hero/hero.presets";
import "./HeroSection.css";

export default function HeroSection() {
  return (
    <section className="iv-home-hero">
      <div className="iv-home-hero__copy">
        <div className="iv-home-hero__eyebrow">{HOME_HERO_CONTENT.eyebrow}</div>
        <h1 className="iv-home-hero__title">{HOME_HERO_CONTENT.title}</h1>
        <p className="iv-home-hero__subtitle">{HOME_HERO_CONTENT.subtitle}</p>

        <div className="iv-home-hero__actions">
          <LinkButton to={HOME_HERO_CONTENT.primaryAction.to} variant="primary" size="md">
            {HOME_HERO_CONTENT.primaryAction.label}
          </LinkButton>
          <LinkButton to={HOME_HERO_CONTENT.secondaryAction.to} variant="outline" size="md">
            {HOME_HERO_CONTENT.secondaryAction.label}
          </LinkButton>
        </div>

        <div className="iv-home-hero__pillRow">
          {HOME_HERO_CONTENT.pills.map((pill) => (
            <span key={pill} className="iv-home-hero__pill">
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="iv-home-hero__visual">
          <div className="iv-home-hero__poster">
            <img src={heroArt} alt="InkVerse fantasy artwork" />
            <div className="iv-home-hero__posterOverlay" />
            <div className="iv-home-hero__posterCard">
              <span className="iv-home-hero__posterLabel">{HOME_HERO_CONTENT.posterLabel}</span>
              <span className="iv-home-hero__posterText">{HOME_HERO_CONTENT.posterText}</span>
            </div>
          </div>
        </div>
    </section>
  );
}
