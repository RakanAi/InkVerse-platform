import rating0 from "@/assets/rating-stickers/rating-0.png";
import rating1 from "@/assets/rating-stickers/rating-1.png";
import rating2 from "@/assets/rating-stickers/rating-2.png";
import rating3 from "@/assets/rating-stickers/rating-3.png";
import rating4 from "@/assets/rating-stickers/rating-4.png";
import rating5 from "@/assets/rating-stickers/rating-5.png";

const STICKERS = {
  0: {
    src: rating0,
    label: "No reviews yet",
  },
  1: {
    src: rating1,
    label: "One star rating",
  },
  2: {
    src: rating2,
    label: "Two star rating",
  },
  3: {
    src: rating3,
    label: "Three star rating",
  },
  4: {
    src: rating4,
    label: "Four star rating",
  },
  5: {
    src: rating5,
    label: "Five star rating",
  },
};

function getStickerLevel(averageRating, reviewCount) {
  if (Number(reviewCount) <= 0) return 0;

  const safeRating = Number.isFinite(Number(averageRating)) ? Number(averageRating) : 0;
  return Math.max(1, Math.min(5, Math.round(safeRating)));
}

export default function BookRatingSticker({
  averageRating = 0,
  reviewCount = 0,
  className = "",
}) {
  const level = getStickerLevel(averageRating, reviewCount);
  const sticker = STICKERS[level] || STICKERS[0];
  const safeRating = Number.isFinite(Number(averageRating)) ? Number(averageRating) : 0;
  const alt =
    level === 0
      ? "No reviews yet rating sticker"
      : `${sticker.label} sticker for ${safeRating.toFixed(1)} average rating`;

  return (
    <figure className={`iv-book-rating-sticker ${className}`.trim()}>
      <img src={sticker.src} alt={alt} loading="lazy" decoding="async" />
    </figure>
  );
}
