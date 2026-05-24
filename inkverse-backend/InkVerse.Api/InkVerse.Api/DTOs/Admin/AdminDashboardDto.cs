namespace InkVerse.Api.DTOs.Admin
{
    public class AdminDashboardDto
    {
        public int Books { get; set; }
        public int Chapters { get; set; }
        public int Genres { get; set; }
        public int Tags { get; set; }
        public int Trends { get; set; }

        public int BooksWithNoChapters { get; set; }
        public int BooksWithNoGenres { get; set; }
        public int BooksWithNoTags { get; set; }
        public int ContractCandidates { get; set; }
        public int OpenReports { get; set; }
        public int OpenModerationCases { get; set; }
        public int ClawbotAutoHandledToday { get; set; }

        public List<AdminLatestBookDto> LatestBooks { get; set; } = new();
        public List<AdminLatestChapterDto> LatestChapters { get; set; } = new();
    }
}
