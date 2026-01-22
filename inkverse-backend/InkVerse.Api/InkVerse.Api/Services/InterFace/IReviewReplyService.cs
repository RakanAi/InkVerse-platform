using InkVerse.Api.DTOs.ReviewReply;

namespace InkVerse.Api.Services.InterFace
{
    public interface IReviewReplyService
    {
        Task<List<ReviewReplyReadDto>> GetRepliesForReviewAsync(int reviewId, string? currentUserId);
        Task<ReviewReplyReadDto?> AddReplyAsync(int reviewId, string userId, ReviewReplyCreateDto dto);

        Task<ReviewReplyReadDto?> UpdateReplyAsync(int replyId, string userId, ReviewReplyUpdateDto dto);
        Task<bool> DeleteReplyAsync(int replyId, string userId);

        Task<bool> ReactToReplyAsync(int replyId, string userId, string reactionType);
    }
}
