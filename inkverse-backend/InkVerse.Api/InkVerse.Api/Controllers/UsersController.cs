using System.Security.Claims;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.DTOs.Review;
using InkVerse.Api.DTOs.User;
using InkVerse.Api.DTOs.UserLibrary;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly InkVerseDB _db;
        private readonly UserManager<AppUser> _userManager;
        private readonly IAchievementService _achievements;

        public UsersController(InkVerseDB db, UserManager<AppUser> userManager, IAchievementService achievements)
        {
            _db = db;
            _userManager = userManager;
            _achievements = achievements;
        }

        [HttpGet("{userName}")]
        public async Task<ActionResult<PublicProfileDto>> GetProfile(string userName)
        {
            var normalizedUserName = (userName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(normalizedUserName))
            {
                return NotFound();
            }

            var user = await _userManager.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.UserName != null &&
                    item.UserName.ToLower() == normalizedUserName.ToLower());

            if (user == null)
            {
                return NotFound();
            }

            var viewerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isOwner = !string.IsNullOrWhiteSpace(viewerId) &&
                string.Equals(viewerId, user.Id, StringComparison.Ordinal);

            var canViewProfile = user.IsProfilePublic || isOwner;
            var showReviews = canViewProfile && (isOwner || user.ShowReviewsOnProfile);
            var showComments = canViewProfile && (isOwner || user.ShowCommentsOnProfile);
            var showLibrary = canViewProfile && (isOwner || user.ShowLibraryOnProfile);
            var showAuthorBooks = canViewProfile && (isOwner || user.ShowAuthorBooksOnProfile);
            var progress = await _achievements.GetProgressionAsync(user.Id, user.Timezone);
            var followerCount = await _db.UserAuthorFollows
                .AsNoTracking()
                .CountAsync(item => item.AuthorId == user.Id && item.IsActive);
            var isFollowedByViewer = !string.IsNullOrWhiteSpace(viewerId) &&
                await _db.UserAuthorFollows
                    .AsNoTracking()
                    .AnyAsync(item => item.AuthorId == user.Id && item.FollowerId == viewerId && item.IsActive);

            var result = new PublicProfileDto
            {
                UserName = user.UserName ?? string.Empty,
                Bio = user.Bio,
                AvatarUrl = Abs(user.AvatarUrl),
                CreatedAt = user.CreatedAt,
                IsProfilePublic = user.IsProfilePublic,
                CanViewProfile = canViewProfile,
                IsOwner = isOwner,
                ReaderLevel = progress.Level,
                IsFollowedByViewer = isFollowedByViewer,
                FollowerCount = followerCount,
                FeaturedAchievements = progress.FeaturedAchievements,
                Visibility = new PublicProfileVisibilityDto
                {
                    Reviews = showReviews,
                    Comments = showComments,
                    Library = showLibrary,
                    AuthorBooks = showAuthorBooks,
                },
            };

            if (!canViewProfile)
            {
                return Ok(result);
            }

            if (showReviews)
            {
                result.Reviews = await _db.Reviews
                    .AsNoTracking()
                    .Where(review => review.UserId == user.Id && !review.IsDeleted)
                    .Include(review => review.Book)
                    .OrderByDescending(review => review.CreatedAt)
                    .Take(30)
                    .Select(review => new MyReviewDto
                    {
                        Id = review.ID,
                        BookId = review.BookId,
                        BookTitle = review.Book.Title,
                        BookCoverUrl = review.Book.CoverImageUrl,
                        Rating = review.Rating,
                        Content = review.Content,
                        CreatedAt = review.CreatedAt,
                    })
                    .ToListAsync();

                foreach (var review in result.Reviews)
                {
                    review.BookCoverUrl = Abs(review.BookCoverUrl) ?? string.Empty;
                }
            }

            if (showComments)
            {
                result.Comments = await _db.ChapterComments
                    .AsNoTracking()
                    .Where(comment => comment.UserId == user.Id && !comment.IsDeleted)
                    .Include(comment => comment.Chapter)
                    .ThenInclude(chapter => chapter!.Book)
                    .OrderByDescending(comment => comment.CreatedAt)
                    .Take(30)
                    .Select(comment => new PublicProfileCommentDto
                    {
                        Id = comment.ID,
                        ChapterId = comment.ChapterId,
                        ChapterNumber = comment.Chapter != null ? comment.Chapter.ChapterNumber : 0,
                        BookId = comment.Chapter != null ? comment.Chapter.BookId : 0,
                        BookTitle = comment.Chapter != null && comment.Chapter.Book != null
                            ? comment.Chapter.Book.Title
                            : string.Empty,
                        Content = comment.Content,
                        ParagraphId = comment.ParagraphId,
                        CreatedAt = comment.CreatedAt,
                        UpdatedAt = comment.UpdatedAt,
                    })
                    .ToListAsync();
            }

            if (showLibrary)
            {
                result.Library = await _db.UserLibraries
                    .AsNoTracking()
                    .Where(entry => entry.UserId == user.Id && entry.IsInLibrary)
                    .Include(entry => entry.Book)
                    .OrderByDescending(entry => entry.LastReadAt ?? entry.CreatedAt)
                    .Select(entry => new UserLibraryDto
                    {
                        BookId = entry.BookId,
                        Title = entry.Book != null ? entry.Book.Title : string.Empty,
                        CoverImageUrl = entry.Book != null ? entry.Book.CoverImageUrl ?? string.Empty : string.Empty,
                        Status = entry.Status,
                        LastReadChapterId = entry.LastReadChapterId,
                        LastReadAt = entry.LastReadAt,
                        IsInLibrary = entry.IsInLibrary,
                    })
                    .ToListAsync();

                foreach (var item in result.Library)
                {
                    item.CoverImageUrl = Abs(item.CoverImageUrl) ?? string.Empty;
                }
            }

            if (showAuthorBooks)
            {
                result.AuthorBooks = await _db.Books
                    .AsNoTracking()
                    .Where(book => book.AuthorId == user.Id)
                    .OrderByDescending(book => book.CreatedAt)
                    .Select(book => new BookReadDto
                    {
                        Id = book.ID,
                        Title = book.Title,
                        Description = book.Description,
                        CoverImageUrl = book.CoverImageUrl,
                        AuthorId = book.AuthorId,
                        AuthorName = book.AuthorName,
                        Status = book.Status.ToString(),
                        WordCount = book.WordCount,
                        TotalViews = book.TotalViews,
                        AverageRating = book.AverageRating,
                        IsFanfic = book.IsFanfic,
                        CreatedAt = book.CreatedAt,
                        UpdatedAt = book.UpdatedAt,
                        ReviewsCount = 0,
                        ChaptersCount = 0,
                        VerseType = book.VerseType.ToString(),
                        OriginType = book.OriginType.ToString(),
                        SourceUrl = book.SourceUrl,
                    })
                    .ToListAsync();

                foreach (var book in result.AuthorBooks)
                {
                    book.CoverImageUrl = Abs(book.CoverImageUrl);
                }
            }

            result.ReviewsCount = result.Reviews.Count;
            result.CommentsCount = result.Comments.Count;
            result.LibraryCount = result.Library.Count;
            result.BooksCount = result.AuthorBooks.Count;
            result.IsAuthor = result.BooksCount > 0;

            return Ok(result);
        }

        private string? Abs(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return url;
            if (url.StartsWith("http://") || url.StartsWith("https://")) return url;

            var path = url.StartsWith("/") ? url : "/" + url;
            return $"{Request.Scheme}://{Request.Host}{path}";
        }
    }
}
