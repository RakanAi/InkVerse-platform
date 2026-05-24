using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Notifications;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Entities.Notifications;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class NotificationService : INotificationService
{
    private readonly InkVerseDB _db;
    private readonly UserManager<AppUser> _userManager;

    public NotificationService(InkVerseDB db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<List<UserNotificationDto>> GetNotificationsAsync(string userId, string? filter, string? category, DateTime? cursor, int take)
    {
        take = take <= 0 ? 20 : Math.Min(take, 50);
        var normalizedFilter = (filter ?? "all").Trim().ToLowerInvariant();
        var normalizedCategory = NormalizeOptionalCategory(category);

        var query = _db.UserNotifications
            .AsNoTracking()
            .Include(item => item.Actor)
            .Where(item => item.RecipientId == userId)
            .AsQueryable();

        if (normalizedFilter == "unread")
        {
            query = query.Where(item => !item.IsRead);
        }
        else if (normalizedFilter != "all")
        {
            throw new InvalidOperationException("Invalid notification filter.");
        }

        if (!string.IsNullOrWhiteSpace(normalizedCategory))
        {
            query = query.Where(item => item.Category == normalizedCategory);
        }

        if (cursor.HasValue)
        {
            query = query.Where(item => item.CreatedAt < cursor.Value);
        }

        var notifications = await query
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.ID)
            .Take(take)
            .ToListAsync();

        return notifications.Select(ToDto).ToList();
    }

    public Task<int> GetUnreadCountAsync(string userId)
    {
        return _db.UserNotifications.CountAsync(item => item.RecipientId == userId && !item.IsRead);
    }

    public async Task<UserNotificationDto?> MarkReadAsync(string userId, int notificationId)
    {
        var notification = await _db.UserNotifications
            .Include(item => item.Actor)
            .FirstOrDefaultAsync(item => item.ID == notificationId && item.RecipientId == userId);

        if (notification == null) return null;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return ToDto(notification);
    }

    public async Task<int> MarkAllReadAsync(string userId)
    {
        var unread = await _db.UserNotifications
            .Where(item => item.RecipientId == userId && !item.IsRead)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var notification in unread)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
        }

        await _db.SaveChangesAsync();
        return unread.Count;
    }

    public async Task<bool> DeleteAsync(string userId, int notificationId)
    {
        var notification = await _db.UserNotifications
            .FirstOrDefaultAsync(item => item.ID == notificationId && item.RecipientId == userId);

        if (notification == null) return false;

        _db.UserNotifications.Remove(notification);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<NotificationPreferenceDto>> GetPreferencesAsync(string userId)
    {
        await EnsurePreferencesAsync(userId);
        return await _db.UserNotificationPreferences
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderBy(item => item.Category)
            .Select(item => new NotificationPreferenceDto
            {
                Category = item.Category,
                InAppEnabled = item.InAppEnabled,
            })
            .ToListAsync();
    }

    public async Task<List<NotificationPreferenceDto>> UpdatePreferencesAsync(string userId, UpdateNotificationPreferencesDto dto)
    {
        await EnsurePreferencesAsync(userId);
        var incoming = dto.Preferences ?? [];
        var existing = await _db.UserNotificationPreferences
            .Where(item => item.UserId == userId)
            .ToListAsync();

        foreach (var item in incoming)
        {
            var category = NormalizeCategory(item.Category);
            var preference = existing.FirstOrDefault(pref => pref.Category == category);
            if (preference == null)
            {
                preference = new UserNotificationPreference
                {
                    UserId = userId,
                    Category = category,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.UserNotificationPreferences.Add(preference);
                existing.Add(preference);
            }

            preference.InAppEnabled = item.InAppEnabled;
            preference.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return await GetPreferencesAsync(userId);
    }

    public async Task<FollowStatusDto?> GetFollowStatusAsync(string viewerId, string userName)
    {
        var author = await ResolveAuthorAsync(userName);
        if (author == null) return null;

        var isFollowing = await _db.UserAuthorFollows
            .AnyAsync(item => item.FollowerId == viewerId && item.AuthorId == author.Id && item.IsActive);
        var count = await CountFollowersAsync(author.Id);

        return new FollowStatusDto
        {
            AuthorId = author.Id,
            AuthorName = author.UserName ?? author.Email ?? "Author",
            IsFollowing = isFollowing,
            FollowerCount = count,
        };
    }

    public async Task<FollowStatusDto> FollowAuthorAsync(string followerId, string userName)
    {
        var author = await ResolveAuthorAsync(userName)
            ?? throw new KeyNotFoundException("Author not found.");

        if (string.Equals(author.Id, followerId, StringComparison.Ordinal))
            throw new InvalidOperationException("You cannot follow yourself.");

        var existing = await _db.UserAuthorFollows
            .FirstOrDefaultAsync(item => item.FollowerId == followerId && item.AuthorId == author.Id);

        if (existing == null)
        {
            _db.UserAuthorFollows.Add(new UserAuthorFollow
            {
                FollowerId = followerId,
                AuthorId = author.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.IsActive = true;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return new FollowStatusDto
        {
            AuthorId = author.Id,
            AuthorName = author.UserName ?? author.Email ?? "Author",
            IsFollowing = true,
            FollowerCount = await CountFollowersAsync(author.Id),
        };
    }

    public async Task<FollowStatusDto?> UnfollowAuthorAsync(string followerId, string userName)
    {
        var author = await ResolveAuthorAsync(userName);
        if (author == null) return null;

        var existing = await _db.UserAuthorFollows
            .FirstOrDefaultAsync(item => item.FollowerId == followerId && item.AuthorId == author.Id);

        if (existing != null)
        {
            existing.IsActive = false;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return new FollowStatusDto
        {
            AuthorId = author.Id,
            AuthorName = author.UserName ?? author.Email ?? "Author",
            IsFollowing = false,
            FollowerCount = await CountFollowersAsync(author.Id),
        };
    }

    public async Task<int> SendSystemNotificationAsync(string adminId, SendSystemNotificationDto dto)
    {
        var title = Clean(dto.Title, 180);
        var body = Clean(dto.Body, 600);
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(body))
            throw new InvalidOperationException("Title and body are required.");

        var recipients = await ResolveSystemAudienceAsync(dto);
        var sent = 0;
        var nowKey = DateTime.UtcNow.Ticks.ToString();

        foreach (var recipientId in recipients.Distinct())
        {
            if (await CreateNotificationAsync(new NotificationCreateRequest(
                recipientId,
                adminId,
                NotificationCategories.System,
                NotificationTypes.System,
                title,
                body,
                CleanNullable(dto.LinkUrl, 500),
                "system",
                nowKey,
                $"system:{nowKey}:{recipientId}"), swallowErrors: false))
            {
                sent++;
            }
        }

        return sent;
    }

    public Task NotifyAsync(NotificationCreateRequest request)
    {
        return CreateNotificationAsync(request, swallowErrors: true);
    }

    public async Task NotifyManyAsync(IEnumerable<string> recipientIds, NotificationCreateRequest request)
    {
        foreach (var recipientId in recipientIds.Where(id => !string.IsNullOrWhiteSpace(id)).Distinct())
        {
            var targeted = request with { RecipientId = recipientId };
            await CreateNotificationAsync(targeted, swallowErrors: true);
        }
    }

    private async Task<bool> CreateNotificationAsync(NotificationCreateRequest request, bool swallowErrors)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RecipientId)) return false;
            if (!string.IsNullOrWhiteSpace(request.ActorId) &&
                string.Equals(request.ActorId, request.RecipientId, StringComparison.Ordinal))
            {
                return false;
            }

            var category = NormalizeCategory(request.Category);
            if (!await IsCategoryEnabledAsync(request.RecipientId, category))
            {
                return false;
            }

            var dedupeKey = Clean(request.DedupeKey, 260);
            if (string.IsNullOrWhiteSpace(dedupeKey))
            {
                dedupeKey = $"{category}:{request.Type}:{request.TargetType}:{request.TargetId}";
            }

            var exists = await _db.UserNotifications
                .AnyAsync(item => item.RecipientId == request.RecipientId && item.DedupeKey == dedupeKey);

            if (exists) return false;

            _db.UserNotifications.Add(new UserNotification
            {
                RecipientId = request.RecipientId,
                ActorId = string.IsNullOrWhiteSpace(request.ActorId) ? null : request.ActorId,
                Category = category,
                Type = Clean(request.Type, 80),
                Title = Clean(request.Title, 180),
                Body = Clean(request.Body, 600),
                LinkUrl = CleanNullable(request.LinkUrl, 500),
                TargetType = CleanNullable(request.TargetType, 80),
                TargetId = CleanNullable(request.TargetId, 80),
                MetadataJson = request.MetadataJson,
                DedupeKey = dedupeKey,
                CreatedAt = DateTime.UtcNow,
            });

            await _db.SaveChangesAsync();
            return true;
        }
        catch when (swallowErrors)
        {
            return false;
        }
    }

    private async Task<bool> IsCategoryEnabledAsync(string userId, string category)
    {
        var preference = await _db.UserNotificationPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Category == category);

        return preference?.InAppEnabled ?? true;
    }

    private async Task EnsurePreferencesAsync(string userId)
    {
        var existing = await _db.UserNotificationPreferences
            .Where(item => item.UserId == userId)
            .ToListAsync();
        var existingCategories = existing.Select(item => item.Category).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var created = false;

        foreach (var category in NotificationCategories.All)
        {
            if (existingCategories.Contains(category)) continue;
            _db.UserNotificationPreferences.Add(new UserNotificationPreference
            {
                UserId = userId,
                Category = category,
                InAppEnabled = true,
                CreatedAt = DateTime.UtcNow,
            });
            created = true;
        }

        if (created)
        {
            await _db.SaveChangesAsync();
        }
    }

    private async Task<List<string>> ResolveSystemAudienceAsync(SendSystemNotificationDto dto)
    {
        var audience = (dto.Audience ?? "all").Trim().ToLowerInvariant();
        if (audience == "all")
        {
            return await _userManager.Users
                .AsNoTracking()
                .Select(item => item.Id)
                .ToListAsync();
        }

        if (audience == "role")
        {
            var role = Clean(dto.Role ?? "", 80);
            if (string.IsNullOrWhiteSpace(role))
                throw new InvalidOperationException("Role is required.");
            return (await _userManager.GetUsersInRoleAsync(role)).Select(item => item.Id).ToList();
        }

        if (audience == "users")
        {
            var ids = (dto.UserIds ?? [])
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct()
                .ToList();

            return await _userManager.Users
                .AsNoTracking()
                .Where(item => ids.Contains(item.Id))
                .Select(item => item.Id)
                .ToListAsync();
        }

        throw new InvalidOperationException("Invalid audience.");
    }

    private async Task<AppUser?> ResolveAuthorAsync(string userName)
    {
        var normalized = (userName ?? "").Trim();
        if (string.IsNullOrWhiteSpace(normalized)) return null;

        var user = await _userManager.Users
            .FirstOrDefaultAsync(item =>
                item.UserName != null &&
                item.UserName.ToLower() == normalized.ToLower());

        if (user == null) return null;

        var hasBooks = await _db.Books.AnyAsync(book => book.AuthorId == user.Id);
        var hasAuthorRole = await _userManager.IsInRoleAsync(user, "Author");
        return hasBooks || hasAuthorRole ? user : null;
    }

    private Task<int> CountFollowersAsync(string authorId)
    {
        return _db.UserAuthorFollows.CountAsync(item => item.AuthorId == authorId && item.IsActive);
    }

    private static UserNotificationDto ToDto(UserNotification notification)
    {
        return new UserNotificationDto
        {
            Id = notification.ID,
            Category = notification.Category,
            Type = notification.Type,
            Title = notification.Title,
            Body = notification.Body,
            LinkUrl = notification.LinkUrl,
            TargetType = notification.TargetType,
            TargetId = notification.TargetId,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ActorId = notification.ActorId,
            ActorName = notification.Actor?.UserName ?? notification.Actor?.Email,
            ActorAvatarUrl = notification.Actor?.AvatarUrl,
        };
    }

    private static string? NormalizeOptionalCategory(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return NormalizeCategory(value);
    }

    private static string NormalizeCategory(string value)
    {
        var normalized = (value ?? "").Trim().ToLowerInvariant();
        return NotificationCategories.All.Contains(normalized)
            ? normalized
            : throw new InvalidOperationException("Invalid notification category.");
    }

    private static string Clean(string? value, int maxLength)
    {
        var clean = (value ?? "").Trim();
        if (clean.Length > maxLength) clean = clean[..maxLength];
        return clean;
    }

    private static string? CleanNullable(string? value, int maxLength)
    {
        var clean = Clean(value, maxLength);
        return string.IsNullOrWhiteSpace(clean) ? null : clean;
    }
}
