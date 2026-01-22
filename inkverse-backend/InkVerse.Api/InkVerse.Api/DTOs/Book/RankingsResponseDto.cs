namespace InkVerse.Api.DTOs.Book
{
    public class RankingsResponseDto
    {
        public List<RankedBookDTO> WeeklyReadRanking { get; set; } = new();
        public List<RankedBookDTO> MonthlyReadRanking { get; set; } = new();
        public List<RankedBookDTO> WeeklyRatingRanking { get; set; } = new();
        public List<RankedBookDTO> MonthlyRatingRanking { get; set; } = new();
    }
}