import { absUrl } from "@/Utils/absUrl";

export const FALLBACK_COVER = "/img/inkverse-fallback-cover.jpg";



export function getBookCoverSrc(book, fallback = FALLBACK_COVER) {
  const raw =
    book?.coverImageUrl ??
    book?.CoverImageUrl ??
    book?.coverUrl ??
    book?.CoverUrl ??
    book?.bookCoverUrl ??
    book?.BookCoverUrl ??
    book?.cover ??
    book?.Cover ??
    book?.imageUrl ??
    book?.ImageUrl ??
    "";
  return raw ? absUrl(raw) : fallback;
}
