using InkVerse.Api.DTOs.Comment;

namespace InkVerse.Api.Mapper
{
    public static class CommentMapper
    {
        public static CommentReadDto MapToReadDto(this ChapterComment comment)
        {
            return new CommentReadDto
            {
                Id = comment.ID,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                ChapterId = comment.ChapterId,
                UserId = comment.UserId,
                UserName = comment.User?.UserName ?? string.Empty
            };
        }
    }
}
