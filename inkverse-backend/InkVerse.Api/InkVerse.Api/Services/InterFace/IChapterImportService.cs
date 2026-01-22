using InkVerse.Api.DTOs.Import;

namespace InkVerse.Api.Services.InterFace
{
    public interface IChapterImportService
    {
        Task<ChapterImportResultDto> ImportChaptersAsync(int bookId, ChaptersImportDto dto);
    }

    public class ChapterImportResultDto
    {
        public int BookId { get; set; }
        public int Inserted { get; set; }
        public int SkippedDuplicates { get; set; }
        public int SkippedEmpty { get; set; }
        public int TotalAfter { get; set; }
    }
}
