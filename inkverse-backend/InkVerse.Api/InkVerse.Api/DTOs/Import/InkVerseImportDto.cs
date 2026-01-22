namespace InkVerse.Api.DTOs.Import
{
    public class ChaptersImportDto
    {
        public string? BookTitle { get; set; }
        public string? Source { get; set; }
        public List<ChapterImportItemDto> Chapters { get; set; } = new();
    }

    public class ChapterImportItemDto
    {
        public int? Number { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Url { get; set; }
    }
}
