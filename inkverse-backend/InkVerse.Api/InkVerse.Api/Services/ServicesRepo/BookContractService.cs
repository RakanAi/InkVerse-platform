using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Entities.Enums;
using InkVerse.Api.Entities.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class BookContractService : IBookContractService
{
    private const int RequiredWordCount = 20000;
    private const int RequiredChapterCount = 10;
    private const int RequiredTotalViews = 1000;

    private readonly InkVerseDB _db;

    public BookContractService(InkVerseDB db)
    {
        _db = db;
    }

    public async Task<BookContractDto> GetAuthorBookContractAsync(int bookId, string userId, bool isAdmin)
    {
        var book = await ResolveBookAsync(bookId);
        EnsureCanUseBook(book, userId, isAdmin);
        var contract = await EnsureEligibleContractAsync(book);
        return await BuildDtoAsync(book, contract);
    }

    public async Task<BookContractDto> AttestRightsAsync(int bookId, string userId, bool isAdmin)
    {
        var book = await ResolveBookAsync(bookId);
        EnsureCanUseBook(book, userId, isAdmin);

        if (book.VerseType != VerseType.AU)
        {
            throw new InvalidOperationException("Only AU books require rights attestation.");
        }

        var contract = await EnsureEligibleContractAsync(book);
        if (contract == null)
        {
            throw new InvalidOperationException("This book does not meet contract eligibility yet.");
        }

        var now = DateTime.UtcNow;
        contract.RightsAttestedById = userId;
        contract.RightsAttestedAt = now;
        contract.UpdatedAt = now;
        ApplySnapshot(contract, book, await CountChaptersAsync(book.ID));

        if (contract.Status == BookContractStatuses.Eligible)
        {
            contract.Status = BookContractStatuses.PendingReview;
        }

        await _db.SaveChangesAsync();
        return await BuildDtoAsync(book, contract);
    }

    public async Task<IReadOnlyList<BookContractDto>> GetAdminQueueAsync(string? status)
    {
        await RefreshEligibleContractsAsync();
        var normalizedStatus = NormalizeStatus(status);
        var query = _db.BookContracts
            .Include(item => item.Book)
            .ThenInclude(book => book!.Author)
            .AsQueryable();

        if (string.IsNullOrWhiteSpace(normalizedStatus))
        {
            query = query.Where(item => BookContractStatuses.CandidateStatuses.Contains(item.Status));
        }
        else
        {
            query = query.Where(item => item.Status == normalizedStatus);
        }

        var contracts = await query
            .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
            .ThenByDescending(item => item.ID)
            .Take(100)
            .ToListAsync();

        var dtos = new List<BookContractDto>();
        foreach (var contract in contracts)
        {
            if (contract.Book == null) continue;
            var dto = await BuildDtoAsync(contract.Book, contract);
            if (BookContractStatuses.CandidateStatuses.Contains(dto.Status) && !dto.MeetsContractMetrics)
            {
                continue;
            }
            dtos.Add(dto);
        }

        return dtos;
    }

    public async Task<BookContractDto> ApproveAsync(int bookId, string adminId, BookContractReviewRequestDto dto)
    {
        var book = await ResolveBookAsync(bookId);
        var contract = await EnsureEligibleContractAsync(book)
            ?? throw new InvalidOperationException("This book does not meet contract eligibility yet.");

        var current = await BuildDtoAsync(book, contract);
        if (!current.CanApprove)
        {
            throw new InvalidOperationException(
                current.ContractMissingRequirements.Any()
                    ? string.Join(" ", current.ContractMissingRequirements)
                    : "This book cannot be approved yet.");
        }

        var now = DateTime.UtcNow;
        var firstApprovalCutoff = contract.PaidChaptersAllowedAfter ?? contract.ApprovedAt ?? now;
        var firstContentLock = contract.ContentLockedAfter ?? contract.ApprovedAt ?? now;
        ApplySnapshot(contract, book, current.ChapterCount);
        contract.Status = BookContractStatuses.Approved;
        contract.ReviewedById = adminId;
        contract.ReviewNote = NormalizeNote(dto.Note);
        contract.ApprovedAt = now;
        contract.PaidChaptersAllowedAfter ??= firstApprovalCutoff;
        contract.ContentLockedAfter ??= firstContentLock;
        contract.RejectedAt = null;
        contract.RevokedAt = null;
        contract.UpdatedAt = now;
        await _db.SaveChangesAsync();

        return await BuildDtoAsync(book, contract);
    }

    public async Task<BookContractDto> RejectAsync(int bookId, string adminId, BookContractReviewRequestDto dto)
    {
        var note = NormalizeNote(dto.Note);
        if (string.IsNullOrWhiteSpace(note))
        {
            throw new InvalidOperationException("A rejection reason is required.");
        }

        var book = await ResolveBookAsync(bookId);
        var contract = await EnsureEligibleContractAsync(book)
            ?? throw new InvalidOperationException("This book does not have a contract review candidate.");

        var now = DateTime.UtcNow;
        ApplySnapshot(contract, book, await CountChaptersAsync(book.ID));
        contract.Status = BookContractStatuses.Rejected;
        contract.ReviewedById = adminId;
        contract.ReviewNote = note;
        contract.RejectedAt = now;
        contract.ApprovedAt = null;
        contract.RevokedAt = null;
        contract.UpdatedAt = now;
        await _db.SaveChangesAsync();

        return await BuildDtoAsync(book, contract);
    }

    public async Task<BookContractDto> RevokeAsync(int bookId, string adminId, BookContractReviewRequestDto dto)
    {
        var book = await ResolveBookAsync(bookId);
        var contract = await _db.BookContracts.FirstOrDefaultAsync(item => item.BookId == bookId)
            ?? throw new InvalidOperationException("This book is not contracted.");

        if (contract.Status != BookContractStatuses.Approved)
        {
            throw new InvalidOperationException("Only approved contracts can be revoked.");
        }

        var now = DateTime.UtcNow;
        ApplySnapshot(contract, book, await CountChaptersAsync(book.ID));
        contract.Status = BookContractStatuses.Revoked;
        contract.ReviewedById = adminId;
        contract.ReviewNote = NormalizeNote(dto.Note);
        contract.RevokedAt = now;
        contract.UpdatedAt = now;
        await _db.SaveChangesAsync();

        return await BuildDtoAsync(book, contract);
    }

    public async Task<int> CountContractCandidatesAsync()
    {
        await RefreshEligibleContractsAsync();
        var contracts = await _db.BookContracts
            .Include(item => item.Book)
            .Where(item => BookContractStatuses.CandidateStatuses.Contains(item.Status))
            .ToListAsync();

        var count = 0;
        foreach (var contract in contracts)
        {
            if (contract.Book == null) continue;
            var dto = await BuildDtoAsync(contract.Book, contract);
            if (dto.MeetsContractMetrics)
            {
                count++;
            }
        }

        return count;
    }

    public async Task<bool> IsBookContractApprovedAsync(int bookId)
    {
        return await _db.BookContracts
            .AnyAsync(item => item.BookId == bookId && item.Status == BookContractStatuses.Approved);
    }

    private async Task RefreshEligibleContractsAsync()
    {
        var candidateBooks = await _db.Books
            .Include(book => book.Author)
            .Where(book =>
                !book.IsDeleted &&
                book.OriginType == OriginType.PlatformOriginal &&
                (book.VerseType == VerseType.Original || book.VerseType == VerseType.AU) &&
                (book.Status == BookStatus.Ongoing || book.Status == BookStatus.Completed) &&
                book.WordCount >= RequiredWordCount &&
                book.TotalViews >= RequiredTotalViews)
            .Select(book => new
            {
                Book = book,
                ChapterCount = _db.Chapters.Count(chapter => chapter.BookId == book.ID),
            })
            .Where(item => item.ChapterCount >= RequiredChapterCount)
            .ToListAsync();

        if (!candidateBooks.Any()) return;

        var candidateBookIds = candidateBooks.Select(item => item.Book.ID).ToList();
        var existingByBookId = await _db.BookContracts
            .Where(item => candidateBookIds.Contains(item.BookId))
            .ToDictionaryAsync(item => item.BookId);

        var changed = false;
        foreach (var item in candidateBooks)
        {
            if (existingByBookId.TryGetValue(item.Book.ID, out var existing))
            {
                if (BookContractStatuses.CandidateStatuses.Contains(existing.Status))
                {
                    ApplySnapshot(existing, item.Book, item.ChapterCount);
                    existing.UpdatedAt = DateTime.UtcNow;
                    changed = true;
                }

                continue;
            }

            var contract = new BookContract
            {
                BookId = item.Book.ID,
                Status = item.Book.VerseType == VerseType.AU
                    ? BookContractStatuses.Eligible
                    : BookContractStatuses.PendingReview,
                CreatedAt = DateTime.UtcNow,
            };
            ApplySnapshot(contract, item.Book, item.ChapterCount);
            _db.BookContracts.Add(contract);
            changed = true;
        }

        if (changed)
        {
            await _db.SaveChangesAsync();
        }
    }

    private async Task<BookContract?> EnsureEligibleContractAsync(Book book)
    {
        var contract = await _db.BookContracts.FirstOrDefaultAsync(item => item.BookId == book.ID);
        var chapterCount = await CountChaptersAsync(book.ID);
        var missing = GetMissingRequirements(book, chapterCount, contract, includeRights: false);

        if (missing.Any())
        {
            return contract;
        }

        if (contract == null)
        {
            contract = new BookContract
            {
                BookId = book.ID,
                Status = book.VerseType == VerseType.AU
                    ? BookContractStatuses.Eligible
                    : BookContractStatuses.PendingReview,
                CreatedAt = DateTime.UtcNow,
            };
            ApplySnapshot(contract, book, chapterCount);
            _db.BookContracts.Add(contract);
            await _db.SaveChangesAsync();
            return contract;
        }

        if (BookContractStatuses.CandidateStatuses.Contains(contract.Status))
        {
            ApplySnapshot(contract, book, chapterCount);
            contract.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return contract;
    }

    private async Task<BookContractDto> BuildDtoAsync(Book book, BookContract? contract)
    {
        var chapterCount = await CountChaptersAsync(book.ID);
        var baseMissing = GetMissingRequirements(book, chapterCount, contract, includeRights: false);
        var allMissing = GetMissingRequirements(book, chapterCount, contract, includeRights: true);
        var meetsMetrics = !baseMissing.Any();
        var contractEligible = !allMissing.Any();
        var status = contract?.Status ?? "not_eligible";

        return new BookContractDto
        {
            Id = contract?.ID,
            BookId = book.ID,
            BookTitle = book.Title,
            AuthorId = book.AuthorId,
            AuthorName = book.AuthorName ?? book.Author?.UserName ?? "Unknown author",
            Status = status,
            IsContracted = status == BookContractStatuses.Approved,
            MeetsContractMetrics = meetsMetrics,
            ContractEligible = contractEligible,
            CanApprove = contractEligible && contract != null && status != BookContractStatuses.Approved,
            RequiresRightsAttestation = book.VerseType == VerseType.AU,
            RightsAttested = contract?.RightsAttestedAt != null,
            RightsAttestedAt = contract?.RightsAttestedAt,
            RightsAttestedById = contract?.RightsAttestedById,
            ReviewedById = contract?.ReviewedById,
            ReviewNote = contract?.ReviewNote,
            ApprovedAt = contract?.ApprovedAt,
            RejectedAt = contract?.RejectedAt,
            RevokedAt = contract?.RevokedAt,
            PaidChaptersAllowedAfter = contract?.PaidChaptersAllowedAfter ?? contract?.ApprovedAt,
            ContentLockedAfter = contract?.ContentLockedAfter ?? contract?.ApprovedAt,
            WordCount = book.WordCount,
            ChapterCount = chapterCount,
            TotalViews = book.TotalViews,
            RequiredWordCount = RequiredWordCount,
            RequiredChapterCount = RequiredChapterCount,
            RequiredTotalViews = RequiredTotalViews,
            VerseType = book.VerseType.ToString(),
            OriginType = book.OriginType.ToString(),
            BookStatus = book.Status.ToString(),
            ContractMissingRequirements = allMissing,
            CreatedAt = contract?.CreatedAt,
            UpdatedAt = contract?.UpdatedAt,
        };
    }

    private IReadOnlyList<string> GetMissingRequirements(
        Book book,
        int chapterCount,
        BookContract? contract,
        bool includeRights)
    {
        var missing = new List<string>();

        if (book.IsDeleted)
        {
            missing.Add("Deleted books cannot be contracted.");
        }

        if (book.OriginType != OriginType.PlatformOriginal)
        {
            missing.Add("Only platform-original books can be contracted.");
        }

        if (book.VerseType != VerseType.Original && book.VerseType != VerseType.AU)
        {
            missing.Add("Only Original and AU books can be contracted.");
        }

        if (book.Status != BookStatus.Ongoing && book.Status != BookStatus.Completed)
        {
            missing.Add("Only ongoing or completed books can be contracted.");
        }

        if (book.WordCount < RequiredWordCount)
        {
            missing.Add($"Needs at least {RequiredWordCount:N0} words.");
        }

        if (chapterCount < RequiredChapterCount)
        {
            missing.Add($"Needs at least {RequiredChapterCount:N0} chapters.");
        }

        if (book.TotalViews < RequiredTotalViews)
        {
            missing.Add($"Needs at least {RequiredTotalViews:N0} views.");
        }

        if (includeRights && book.VerseType == VerseType.AU && contract?.RightsAttestedAt == null)
        {
            missing.Add("AU rights attestation is required before approval.");
        }

        return missing;
    }

    private static void ApplySnapshot(BookContract contract, Book book, int chapterCount)
    {
        contract.SnapshotWordCount = book.WordCount;
        contract.SnapshotChapterCount = chapterCount;
        contract.SnapshotTotalViews = book.TotalViews;
        contract.SnapshotVerseType = book.VerseType.ToString();
        contract.SnapshotOriginType = book.OriginType.ToString();
        contract.SnapshotBookStatus = book.Status.ToString();
    }

    private async Task<Book> ResolveBookAsync(int bookId)
    {
        return await _db.Books
            .Include(book => book.Author)
            .FirstOrDefaultAsync(book => book.ID == bookId)
            ?? throw new InvalidOperationException("Book not found.");
    }

    private async Task<int> CountChaptersAsync(int bookId)
    {
        return await _db.Chapters.CountAsync(chapter => chapter.BookId == bookId);
    }

    private static void EnsureCanUseBook(Book book, string userId, bool isAdmin)
    {
        if (!isAdmin && !string.Equals(book.AuthorId, userId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("You are not allowed to view this book contract.");
        }
    }

    private static string NormalizeStatus(string? status)
    {
        var value = status?.Trim().ToLowerInvariant() ?? "";
        return value switch
        {
            BookContractStatuses.Eligible => BookContractStatuses.Eligible,
            BookContractStatuses.PendingReview => BookContractStatuses.PendingReview,
            BookContractStatuses.Approved => BookContractStatuses.Approved,
            BookContractStatuses.Rejected => BookContractStatuses.Rejected,
            BookContractStatuses.Revoked => BookContractStatuses.Revoked,
            _ => "",
        };
    }

    private static string? NormalizeNote(string? note)
    {
        var value = note?.Trim();
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Length <= 1200 ? value : value[..1200];
    }
}
