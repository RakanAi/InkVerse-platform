using InkVerse.Api.DTOs.Review;

namespace InkVerse.Api.Services.InterFace
{
    public interface IReviewService
    { 
        Task<List<ReviewReadDto>> GetReviewsForBookAsync(int bookId, string? currentUserId);
        Task<ReviewReadDto?> AddOrUpdateReviewAsync(int bookId, string userId, ReviewCreateDto dto);
        Task<ReviewReadDto?> UpdateReviewAsync(int reviewId, string userId, ReviewCreateDto dto);
        Task<bool> DeleteReviewAsync(int reviewId, string userId);
        Task<bool> ReactToReviewAsync(int reviewId, string userId, string reactionType);
        Task<List<ReviewReadDto>> GetRecentReviewsAsync(int take);

    }

}
