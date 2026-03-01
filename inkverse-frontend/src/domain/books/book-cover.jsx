import { absUrl } from "@/Utils/absUrl";

export const FALLBACK_COVER = "/public/img/placeholder-cover.png";



export function getBookCoverSrc(book, fallback = FALLBACK_COVER) {
  const raw =
    book?.coverImageUrl ??
    book?.CoverImageUrl ??
    book?.imageUrl ??
    book?.ImageUrl ??
    "";
  return raw ? absUrl(raw) : fallback;
}