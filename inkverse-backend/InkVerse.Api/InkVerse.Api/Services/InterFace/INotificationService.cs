using InkVerse.Api.DTOs.Notifications;

namespace InkVerse.Api.Services.InterFace;

public record NotificationCreateRequest(
    string RecipientId,
    string? ActorId,
    string Category,
    string Type,
    string Title,
    string Body,
    string? LinkUrl,
    string? TargetType,
    string? TargetId,
    string DedupeKey,
    string? MetadataJson = null);

public interface INotificationService
{
    Task<List<UserNotificationDto>> GetNotificationsAsync(string userId, string? filter, string? category, DateTime? cursor, int take);
    Task<int> GetUnreadCountAsync(string userId);
    Task<UserNotificationDto?> MarkReadAsync(string userId, int notificationId);
    Task<int> MarkAllReadAsync(string userId);
    Task<bool> DeleteAsync(string userId, int notificationId);
    Task<List<NotificationPreferenceDto>> GetPreferencesAsync(string userId);
    Task<List<NotificationPreferenceDto>> UpdatePreferencesAsync(string userId, UpdateNotificationPreferencesDto dto);
    Task<FollowStatusDto?> GetFollowStatusAsync(string viewerId, string userName);
    Task<FollowStatusDto> FollowAuthorAsync(string followerId, string userName);
    Task<FollowStatusDto?> UnfollowAuthorAsync(string followerId, string userName);
    Task<int> SendSystemNotificationAsync(string adminId, SendSystemNotificationDto dto);
    Task NotifyAsync(NotificationCreateRequest request);
    Task NotifyManyAsync(IEnumerable<string> recipientIds, NotificationCreateRequest request);
}
