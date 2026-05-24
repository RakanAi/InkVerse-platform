using Microsoft.AspNetCore.Http;

namespace InkVerse.Api.Services.InterFace;

public sealed record StoredFileResult(string Url, string Key);

public interface IFileStorageService
{
    Task<StoredFileResult> SaveAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default);
}
