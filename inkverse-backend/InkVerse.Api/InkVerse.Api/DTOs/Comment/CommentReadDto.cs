namespace InkVerse.Api.DTOs.Comment
{
    public class CommentReadDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? ParagraphId { get; set; }
        public int ChapterId { get; set; }
        public int Likes { get; set; }
        public int Dislikes { get; set; }
        public List<CommentReadDto> Replies { get; set; } = new();
    }


}
