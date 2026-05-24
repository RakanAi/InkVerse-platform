namespace InkVerse.Api.DTOs.Notifications;

public class UserNotificationDto
{
    public int Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string? TargetType { get; set; }
    public string? TargetId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? ActorAvatarUrl { get; set; }
}

public class NotificationUnreadCountDto
{
    public int UnreadCount { get; set; }
}

public class NotificationPreferenceDto
{
    public string Category { get; set; } = string.Empty;
    public bool InAppEnabled { get; set; }
}

public class UpdateNotificationPreferencesDto
{
    public List<NotificationPreferenceDto> Preferences { get; set; } = [];
}

public class FollowStatusDto
{
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public bool IsFollowing { get; set; }
    public int FollowerCount { get; set; }
}

public class SendSystemNotificationDto
{
    public string Audience { get; set; } = "all";
    public string? Role { get; set; }
    public List<string> UserIds { get; set; } = [];
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
}

public class SendSystemNotificationResultDto
{
    public int SentCount { get; set; }
}
