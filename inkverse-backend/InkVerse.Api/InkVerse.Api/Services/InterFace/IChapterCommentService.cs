using InkVerse.Api.DTOs.Comment;

namespace InkVerse.Api.Services.InterFace
{
    public interface IChapterCommentService
    {
        Task<List<ChapterCommentDto>> GetChapterCommentsAsync(int chapterId, string? userId);
        Task<ChapterCommentDto> AddCommentAsync(int chapterId, string userId, CommentCreateDto dto);
        Task ToggleReactionAsync(int commentId, string userId, int value); // 1 or -1
        Task DeleteCommentAsync(int commentId, string userId); // optional    }

        Task<ChapterCommentDto> UpdateCommentAsync(int commentId, string userId, CommentUpdateDto dto);

    }
}
