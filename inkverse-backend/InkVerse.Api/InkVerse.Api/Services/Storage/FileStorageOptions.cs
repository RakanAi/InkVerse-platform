namespace InkVerse.Api.Services.Storage;

public sealed class FileStorageOptions
{
    public const string SectionName = "Storage";
    public const string LocalProvider = "Local";
    public const string R2Provider = "R2";

    public string Provider { get; set; } = LocalProvider;
    public R2StorageOptions R2 { get; set; } = new();
}

public sealed class R2StorageOptions
{
    public string AccountId { get; set; } = "";
    public string Endpoint { get; set; } = "";
    public string BucketName { get; set; } = "";
    public string AccessKeyId { get; set; } = "";
    public string SecretAccessKey { get; set; } = "";
    public string PublicBaseUrl { get; set; } = "";
    public string Region { get; set; } = "auto";
    public string CacheControl { get; set; } = "public, max-age=31536000, immutable";
}
