namespace InkVerse.Api.Services.InterFace
{
    public interface IReadingProgressService
    {
        Task<int?> GetLastReadChapterAsync(int bookId, string userId);
        Task UpdateLastReadChapterAsync(int bookId, int chapterId, string userId);
    }
}
