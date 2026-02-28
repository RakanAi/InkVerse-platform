import type { BookStatus } from "@/core/enums/book-status.enum";
import type { VerseType } from "@/core/enums/verse-type.enum";

export interface Book {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  authorName?: string;

  status?: BookStatus;
  verseType?: VerseType;
  originType?: string;

  averageRating?: number;
  reviewCount?: number;
  chapterCount?: number;

  tags?: string[];   // or Tag[]
  genres?: string[]; // or Genre[]
}