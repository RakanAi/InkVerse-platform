namespace InkVerse.Api.Services.Storage;

internal static class StoragePath
{
    public static string BuildObjectKey(string folder, string originalFileName)
    {
        var normalizedFolder = NormalizeFolderForUrl(folder);
        var normalizedExtension = NormalizeExtension(Path.GetExtension(originalFileName));
        var readableName = BuildReadableName(originalFileName);
        var uniqueSuffix = Guid.NewGuid().ToString("N")[..8];

        return $"{normalizedFolder}/{readableName}-{uniqueSuffix}{normalizedExtension}";
    }

    public static string NormalizeFolderForDisk(string folder)
    {
        var parts = GetSafeFolderParts(folder);
        return Path.Combine(parts);
    }

    public static string NormalizeFolderForUrl(string folder)
    {
        return string.Join("/", GetSafeFolderParts(folder));
    }

    public static string BuildPublicUrl(string publicBaseUrl, string key)
    {
        var encodedKey = string.Join(
            "/",
            key.Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Select(Uri.EscapeDataString));

        return $"{publicBaseUrl.TrimEnd('/')}/{encodedKey}";
    }

    private static string NormalizeExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension))
        {
            throw new InvalidOperationException("Uploaded file must include an extension.");
        }

        return extension.StartsWith('.') ? extension.ToLowerInvariant() : $".{extension.ToLowerInvariant()}";
    }

    public static string BuildFolderSegment(string value, string fallback = "upload")
    {
        return BuildSlug(value, fallback, maxLength: 80);
    }

    private static string BuildReadableName(string originalFileName)
    {
        var baseName = Path.GetFileNameWithoutExtension(originalFileName);

        return BuildSlug(baseName, "upload", maxLength: 80);
    }

    private static string BuildSlug(string value, string fallback, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            value = fallback;
        }

        var chars = value
            .Trim()
            .ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) ? character : '-')
            .ToArray();

        var slug = new string(chars);
        while (slug.Contains("--", StringComparison.Ordinal))
        {
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        }

        slug = slug.Trim('-');
        if (string.IsNullOrWhiteSpace(slug))
        {
            slug = fallback;
        }

        return slug.Length <= maxLength ? slug : slug[..maxLength].Trim('-');
    }

    private static string[] GetSafeFolderParts(string folder)
    {
        var parts = (folder ?? "")
            .Replace('\\', '/')
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length == 0)
        {
            throw new InvalidOperationException("Upload folder is required.");
        }

        foreach (var part in parts)
        {
            if (part is "." or ".." || part.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            {
                throw new InvalidOperationException("Upload folder is invalid.");
            }
        }

        return parts;
    }
}
