namespace InkVerse.Api.DTOs.User
{
    public class UpdateUserSettingsDto
    {
        public bool IsProfilePublic { get; set; }
        public bool ShowReviewsOnProfile { get; set; }
        public bool ShowCommentsOnProfile { get; set; }
        public bool ShowLibraryOnProfile { get; set; }
        public bool ShowAuthorBooksOnProfile { get; set; }
        public bool EmailNotificationsEnabled { get; set; }
        public bool ReadingRemindersEnabled { get; set; }
        public string PreferredLanguage { get; set; } = "en";
        public string Timezone { get; set; } = "UTC";
    }
}
