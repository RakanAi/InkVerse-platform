using Amazon.S3;
using Amazon.S3.Model;
using InkVerse.Api.Services.InterFace;
using Microsoft.Extensions.Options;

namespace InkVerse.Api.Services.Storage;

public sealed class R2FileStorageService : IFileStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly R2StorageOptions _options;

    public R2FileStorageService(IAmazonS3 s3, IOptions<FileStorageOptions> options)
    {
        _s3 = s3;
        _options = options.Value.R2;
        ValidateOptions(_options);
    }

    public async Task<StoredFileResult> SaveAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default)
    {
        var key = StoragePath.BuildObjectKey(folder, file.FileName);

        await using var stream = file.OpenReadStream();
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = stream,
            ContentType = ResolveContentType(file),
            DisablePayloadSigning = true,
            DisableDefaultChecksumValidation = true
        };

        if (!string.IsNullOrWhiteSpace(_options.CacheControl))
        {
            request.Headers.CacheControl = _options.CacheControl;
        }

        await _s3.PutObjectAsync(request, cancellationToken);

        return new StoredFileResult(StoragePath.BuildPublicUrl(_options.PublicBaseUrl, key), key);
    }

    private static string ResolveContentType(IFormFile file)
    {
        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return file.ContentType;
        }

        return Path.GetExtension(file.FileName).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }

    private static void ValidateOptions(R2StorageOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.BucketName))
        {
            throw new InvalidOperationException("Storage:R2:BucketName is required when Storage:Provider is R2.");
        }

        if (string.IsNullOrWhiteSpace(options.AccessKeyId))
        {
            throw new InvalidOperationException("Storage:R2:AccessKeyId is required when Storage:Provider is R2.");
        }

        if (string.IsNullOrWhiteSpace(options.SecretAccessKey))
        {
            throw new InvalidOperationException("Storage:R2:SecretAccessKey is required when Storage:Provider is R2.");
        }

        if (string.IsNullOrWhiteSpace(options.PublicBaseUrl))
        {
            throw new InvalidOperationException("Storage:R2:PublicBaseUrl is required so uploaded images can be displayed.");
        }
    }
}
