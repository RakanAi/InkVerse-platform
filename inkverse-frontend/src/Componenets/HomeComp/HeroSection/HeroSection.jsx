import LinkButton from "@/Shared/ui/LinkButton";
import { useTranslation } from "react-i18next";
import heroArt from "../../../assets/BackGround_04.png";
import { getHomeHeroContent } from "@/features/home/hero/hero.presets";
import { useSiteVisualAssetView } from "@/features/site-visuals/useSiteVisualAsset";
import "./HeroSection.css";

export default function HeroSection() {
  const { t } = useTranslation();
  const heroContent = getHomeHeroContent(t);
  const heroImage = useSiteVisualAssetView("home.hero", heroArt);

  return (
    <section className="iv-home-hero">
      <div className="iv-home-hero__copy">
        <div className="iv-home-hero__eyebrow">{heroContent.eyebrow}</div>
        <h1 className="iv-home-hero__title">{heroContent.title}</h1>
        <p className="iv-home-hero__subtitle">{heroContent.subtitle}</p>

        <div className="iv-home-hero__actions">
          <LinkButton to={heroContent.primaryAction.to} variant="primary" size="md">
            {heroContent.primaryAction.label}
          </LinkButton>
          <LinkButton to={heroContent.secondaryAction.to} variant="outline" size="md">
            {heroContent.secondaryAction.label}
          </LinkButton>
        </div>

        <div className="iv-home-hero__pillRow">
          {heroContent.pills.map((pill) => (
            <span key={pill} className="iv-home-hero__pill">
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="iv-home-hero__visual">
          <div className="iv-home-hero__poster">
            <img src={heroImage.src} alt={heroContent.posterAlt} style={heroImage.style} />
            <div className="iv-home-hero__posterOverlay" />
            <div className="iv-home-hero__posterCard">
              <span className="iv-home-hero__posterLabel">{heroContent.posterLabel}</span>
              <span className="iv-home-hero__posterText">{heroContent.posterText}</span>
            </div>
          </div>
        </div>
    </section>
  );
}
