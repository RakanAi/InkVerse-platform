namespace InkVerse.Api.DTOs.User
{
    public class UserSettingsDto
    {
        public bool IsProfilePublic { get; set; }
        public bool EmailNotificationsEnabled { get; set; }
        public bool ReadingRemindersEnabled { get; set; }
        public string PreferredLanguage { get; set; } = "en";
    }
}
