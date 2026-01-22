using InkVerse.Api.DTOs.Review;


namespace InkVerse.Api.Services.InterFace

{
    public interface IMyReviewService
    {
        Task<List<MyReviewDto>> GetMyReviewsAsync(string userId);
    }
}
