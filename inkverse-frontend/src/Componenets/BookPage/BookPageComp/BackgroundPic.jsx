import "../BookPage.css";
// import img from "../../Essence/BooksData.json"
import bgImage from "../../../assets/BackGround_04.png"; // ✅ import image


export default function Bgpic() {



  return (
    <div>
      <img src={bgImage} alt="" className="bg-img" />
    </div>
  );
}
