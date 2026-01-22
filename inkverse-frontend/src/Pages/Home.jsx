import HeroSection from '../Componenets/HomeComp/HeroSection/HeroSection';
import NewBooks from '../Componenets/HomeComp/NewBooks/NewBooks';
import TopVersesBooks from '../Componenets/HomeComp/TopVersesVooks/TopVersesBooks';
import TrendCora from '../Componenets/HomeComp/Trend/Trend';
import TopTags from '../Componenets/HomeComp/TagSec/TagSec';
import RecentReviews from '../Componenets/HomeComp/RecentReviews/RecentReviews';

export default function Home() {
    

    return (
      <div className="Home">
        <div>
          <HeroSection />
          <></>
          <NewBooks />
          <></>
          <TrendCora />
          <></>
          <TopVersesBooks />
          <></>
          <TopTags />
          <></>
          <></>
          <RecentReviews />
        </div>
      </div>
    );

}