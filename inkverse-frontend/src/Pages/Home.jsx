import HeroSection from "../Componenets/HomeComp/HeroSection/HeroSection";
import NewBooks from "../Componenets/HomeComp/NewBooks/NewBooks";
import TopVersesBooks from "../Componenets/HomeComp/TopVersesVooks/TopVersesBooks";
import TrendCora from "../Componenets/HomeComp/Trend/Trend";
import TopTags from "../Componenets/HomeComp/TagSec/TagSec";
import RecentReviews from "../Componenets/HomeComp/RecentReviews/RecentReviews";
import "@/features/home/shared/home.tokens.css";
import "./page-styles/Home.css";

export default function Home() {
  return (
    <div className="iv-home">
      <div className="iv-home-shell">
        <HeroSection />
        <NewBooks />
        <TrendCora />

        <TopVersesBooks />
        <RecentReviews />
        <TopTags />
      </div>
    </div>
  );
}
