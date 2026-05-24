using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.Storage;

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<StoredFileResult> SaveAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default)
    {
        var key = StoragePath.BuildObjectKey(folder, file.FileName);
        var diskFolder = StoragePath.NormalizeFolderForDisk(Path.GetDirectoryName(key) ?? folder);
        var fileName = Path.GetFileName(key);
        var uploadsRoot = GetUploadsRoot(diskFolder);
        var fullPath = Path.Combine(uploadsRoot, fileName);

        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream, cancellationToken);

        return new StoredFileResult($"/uploads/{key}", key);
    }

    private string GetUploadsRoot(string folder)
    {
        var webRoot = _env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploadsRoot = Path.Combine(webRoot, "uploads", folder);
        Directory.CreateDirectory(uploadsRoot);
        return uploadsRoot;
    }
}
