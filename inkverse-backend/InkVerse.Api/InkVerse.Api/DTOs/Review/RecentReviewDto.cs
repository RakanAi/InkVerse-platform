namespace InkVerse.Api.DTOs.Review
{
    public class RecentReviewDto
    {
        public int Id { get; set; }
        public string Book { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public double Rating { get; set; }
        public string ReviewText { get; set; } = string.Empty;
        public string ReviewTitle { get; set; } = "Recent Review";
        public string Image { get; set; } = "/default-user.png";
    }

}
