using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Entities.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class MonetizationService : IMonetizationService
{
    private const int PaidChapterPriceCoins = 5;
    private const int AuthorRoyaltyBasisPoints = 7500;
    private static readonly TimeSpan RoyaltyHold = TimeSpan.FromDays(14);

    private static readonly IReadOnlyList<CoinPackDto> CoinPacks =
    [
        new("coins-500", "$5 Coin Pack", 500, 500),
        new("coins-1000", "$10 Coin Pack", 1000, 1000),
        new("coins-2000", "$20 Coin Pack", 2000, 2000),
    ];

    private readonly InkVerseDB _db;

    public MonetizationService(InkVerseDB db)
    {
        _db = db;
    }

    public IReadOnlyList<CoinPackDto> GetCoinPacks() => CoinPacks;

    public async Task<WalletDto> GetWalletAsync(string userId)
    {
        var wallet = await EnsureWalletAsync(userId);
        return new WalletDto
        {
            CoinBalance = wallet.CoinBalance,
            CreditBalance = wallet.CreditBalance,
            Packs = CoinPacks,
        };
    }

    public async Task<IReadOnlyList<CoinLedgerEntryDto>> GetWalletLedgerAsync(string userId)
    {
        return await _db.CoinLedgerEntries
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .Take(80)
            .Select(item => new CoinLedgerEntryDto
            {
                Id = item.ID,
                AmountCoins = item.AmountCoins,
                BalanceAfterCoins = item.BalanceAfterCoins,
                EntryType = item.EntryType,
                Description = item.Description,
                CreatedAt = item.CreatedAt,
            })
            .ToListAsync();
    }

    public async Task<CheckoutSessionDto> CreateCheckoutSessionAsync(string userId, CreateCheckoutSessionDto dto)
    {
        var pack = CoinPacks.FirstOrDefault(item =>
            string.Equals(item.Code, dto.PackCode, StringComparison.OrdinalIgnoreCase));

        if (pack == null)
        {
            throw new InvalidOperationException("Unknown coin pack.");
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();
        var wallet = await EnsureWalletAsync(userId);
        wallet.CoinBalance += pack.Coins;
        wallet.UpdatedAt = DateTime.UtcNow;

        var reference = $"mock_{Guid.NewGuid():N}";
        _db.CoinPurchases.Add(new CoinPurchase
        {
            UserId = userId,
            PackCode = pack.Code,
            Coins = pack.Coins,
            AmountCents = pack.AmountCents,
            ProviderReference = reference,
            CreatedAt = DateTime.UtcNow,
        });

        _db.CoinLedgerEntries.Add(new CoinLedgerEntry
        {
            UserId = userId,
            AmountCoins = pack.Coins,
            BalanceAfterCoins = wallet.CoinBalance,
            EntryType = "purchase",
            SourceType = "coin_purchase",
            SourceId = reference,
            Description = $"{pack.Label} completed by mock checkout.",
            CreatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return new CheckoutSessionDto
        {
            ProviderReference = reference,
            CoinsAdded = pack.Coins,
            CoinBalance = wallet.CoinBalance,
        };
    }

    public async Task<bool> CanChargeChapterAsync(int chapterId, int bookId, string? authorId)
    {
        if (bookId <= 0 || string.IsNullOrWhiteSpace(authorId))
        {
            return false;
        }

        var contract = await _db.BookContracts
            .FirstOrDefaultAsync(item => item.BookId == bookId);

        if (contract?.Status != BookContractStatuses.Approved)
        {
            return false;
        }

        var paidChaptersAllowedAfter = contract.PaidChaptersAllowedAfter ?? contract.ApprovedAt;
        if (paidChaptersAllowedAfter == null)
        {
            return false;
        }

        if (chapterId > 0)
        {
            var chapterCreatedAt = await _db.Chapters
                .Where(item => item.ID == chapterId)
                .Select(item => (DateTime?)item.CreatedAt)
                .FirstOrDefaultAsync();

            if (chapterCreatedAt == null ||
                chapterCreatedAt.Value < paidChaptersAllowedAfter.Value)
            {
                return false;
            }
        }

        var agreement = await EnsureActiveAgreementAsync();
        return await _db.AuthorAgreementAcceptances
            .AnyAsync(item => item.AuthorId == authorId && item.Version == agreement.Version);
    }

    public async Task<bool> CanAuthorMutateChapterAsync(int chapterId, string? userId, bool isAdmin)
    {
        if (isAdmin)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            return false;
        }

        var chapter = await _db.Chapters
            .Include(item => item.Book)
            .FirstOrDefaultAsync(item => item.ID == chapterId);

        if (chapter?.Book == null ||
            !string.Equals(chapter.Book.AuthorId, userId, StringComparison.Ordinal))
        {
            return false;
        }

        var contract = await _db.BookContracts
            .Where(item => item.BookId == chapter.BookId)
            .Select(item => new { item.ContentLockedAfter, item.ApprovedAt })
            .FirstOrDefaultAsync();

        var contentLockedAfter = contract?.ContentLockedAfter ?? contract?.ApprovedAt;
        return contentLockedAfter == null;
    }

    public async Task<ChapterReadDto> ApplyChapterAccessAsync(ChapterReadDto chapter, string? userId, bool isAdmin)
    {
        var monetization = await _db.ChapterMonetizations
            .Include(item => item.Chapter)
            .ThenInclude(item => item!.Book)
            .FirstOrDefaultAsync(item => item.ChapterId == chapter.Id);

        if (monetization?.IsPaid != true)
        {
            chapter.IsPaid = false;
            chapter.IsLocked = false;
            chapter.IsUnlocked = true;
            chapter.PriceCoins = 0;
            return chapter;
        }

        if (!await CanChargeChapterAsync(
                monetization.ChapterId,
                monetization.Chapter?.Book?.ID ?? 0,
                monetization.Chapter?.Book?.AuthorId))
        {
            chapter.IsPaid = false;
            chapter.IsLocked = false;
            chapter.IsUnlocked = true;
            chapter.PriceCoins = 0;
            return chapter;
        }

        var isOwner = !string.IsNullOrWhiteSpace(userId) &&
            string.Equals(monetization.Chapter?.Book?.AuthorId, userId, StringComparison.Ordinal);
        var hasUnlock = !string.IsNullOrWhiteSpace(userId) &&
            await _db.ChapterUnlocks.AnyAsync(item => item.ChapterId == chapter.Id && item.UserId == userId);
        var isUnlocked = isAdmin || isOwner || hasUnlock;

        chapter.IsPaid = true;
        chapter.PriceCoins = monetization.PriceCoins <= 0 ? PaidChapterPriceCoins : monetization.PriceCoins;
        chapter.Teaser = BuildTeaser(monetization.Teaser, chapter.Content);
        chapter.IsUnlocked = isUnlocked;
        chapter.IsLocked = !isUnlocked;

        if (!isUnlocked)
        {
            chapter.Content = string.Empty;
        }

        return chapter;
    }

    public async Task<ChapterMonetizationDto> UpdateChapterMonetizationAsync(
        int chapterId,
        string userId,
        bool isAdmin,
        UpdateChapterMonetizationDto dto)
    {
        var chapter = await _db.Chapters
            .Include(item => item.Book)
            .FirstOrDefaultAsync(item => item.ID == chapterId);

        if (chapter == null)
        {
            throw new InvalidOperationException("Chapter not found.");
        }

        if (!isAdmin && chapter.Book?.AuthorId != userId)
        {
            throw new UnauthorizedAccessException("You are not allowed to monetize this chapter.");
        }

        if (dto.IsPaid)
        {
            var contract = await _db.BookContracts
                .FirstOrDefaultAsync(item => item.BookId == chapter.BookId);
            var cutoff = contract?.PaidChaptersAllowedAfter ?? contract?.ApprovedAt;

            if (contract?.Status == BookContractStatuses.Approved &&
                cutoff != null &&
                chapter.CreatedAt < cutoff.Value)
            {
                throw new InvalidOperationException("Only chapters created after contract approval can be paid.");
            }

            if (!await CanChargeChapterAsync(chapter.ID, chapter.BookId, chapter.Book?.AuthorId))
            {
                throw new InvalidOperationException("This book needs an approved contract and accepted monetization agreement before chapters can be paid.");
            }
        }

        var monetization = await _db.ChapterMonetizations
            .FirstOrDefaultAsync(item => item.ChapterId == chapterId);

        if (monetization == null)
        {
            monetization = new ChapterMonetization
            {
                ChapterId = chapterId,
                CreatedAt = DateTime.UtcNow,
            };
            _db.ChapterMonetizations.Add(monetization);
        }

        monetization.IsPaid = dto.IsPaid;
        monetization.PriceCoins = PaidChapterPriceCoins;
        monetization.Teaser = string.IsNullOrWhiteSpace(dto.Teaser)
            ? BuildTeaser(null, chapter.Content)
            : dto.Teaser.Trim();
        monetization.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new ChapterMonetizationDto
        {
            ChapterId = chapterId,
            IsPaid = monetization.IsPaid,
            PriceCoins = monetization.PriceCoins,
            Teaser = monetization.Teaser,
        };
    }

    public async Task<UnlockChapterResultDto> UnlockChapterAsync(int chapterId, string userId)
    {
        var chapter = await _db.Chapters
            .Include(item => item.Book)
            .FirstOrDefaultAsync(item => item.ID == chapterId);

        if (chapter == null)
        {
            throw new InvalidOperationException("Chapter not found.");
        }

        var monetization = await _db.ChapterMonetizations
            .FirstOrDefaultAsync(item => item.ChapterId == chapterId);

        if (monetization?.IsPaid != true)
        {
            return new UnlockChapterResultDto
            {
                ChapterId = chapterId,
                AlreadyUnlocked = true,
                PriceCoins = 0,
                CoinBalance = (await EnsureWalletAsync(userId)).CoinBalance,
            };
        }

        if (!await CanChargeChapterAsync(chapter.ID, chapter.BookId, chapter.Book?.AuthorId))
        {
            return new UnlockChapterResultDto
            {
                ChapterId = chapterId,
                AlreadyUnlocked = true,
                PriceCoins = 0,
                CoinBalance = (await EnsureWalletAsync(userId)).CoinBalance,
            };
        }

        if (chapter.Book?.AuthorId == userId)
        {
            return new UnlockChapterResultDto
            {
                ChapterId = chapterId,
                AlreadyUnlocked = true,
                PriceCoins = 0,
                CoinBalance = (await EnsureWalletAsync(userId)).CoinBalance,
            };
        }

        var existingUnlock = await _db.ChapterUnlocks
            .FirstOrDefaultAsync(item => item.ChapterId == chapterId && item.UserId == userId);
        var wallet = await EnsureWalletAsync(userId);

        if (existingUnlock != null)
        {
            return new UnlockChapterResultDto
            {
                ChapterId = chapterId,
                AlreadyUnlocked = true,
                PriceCoins = existingUnlock.PaidCoins,
                CoinBalance = wallet.CoinBalance,
            };
        }

        var price = monetization.PriceCoins <= 0 ? PaidChapterPriceCoins : monetization.PriceCoins;
        if (wallet.CoinBalance < price)
        {
            throw new InvalidOperationException("Not enough coins.");
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();

        wallet.CoinBalance -= price;
        wallet.UpdatedAt = DateTime.UtcNow;
        _db.ChapterUnlocks.Add(new ChapterUnlock
        {
            UserId = userId,
            ChapterId = chapterId,
            PaidCoins = price,
            CreatedAt = DateTime.UtcNow,
        });

        _db.CoinLedgerEntries.Add(new CoinLedgerEntry
        {
            UserId = userId,
            AmountCoins = -price,
            BalanceAfterCoins = wallet.CoinBalance,
            EntryType = "chapter_unlock",
            SourceType = "chapter",
            SourceId = chapterId.ToString(),
            Description = $"Unlocked chapter {chapter.ChapterNumber}.",
            CreatedAt = DateTime.UtcNow,
        });

        if (!string.IsNullOrWhiteSpace(chapter.Book?.AuthorId))
        {
            var authorCoins = CalculateAuthorShare(price);
            var platformCoins = price - authorCoins;
            var availableAt = DateTime.UtcNow.Add(RoyaltyHold);
            _db.RoyaltyLedgerEntries.Add(new RoyaltyLedgerEntry
            {
                AuthorId = chapter.Book.AuthorId,
                ReaderId = userId,
                BookId = chapter.BookId,
                ChapterId = chapter.ID,
                GrossCoins = price,
                NetCoins = price,
                AuthorCoins = authorCoins,
                PlatformCoins = platformCoins,
                EntryType = "chapter_unlock",
                Status = "pending",
                AvailableAt = availableAt,
                CreatedAt = DateTime.UtcNow,
            });

            var balance = await EnsureAuthorBalanceAsync(chapter.Book.AuthorId);
            balance.PendingCoins += authorCoins;
            balance.LifetimeCoins += authorCoins;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return new UnlockChapterResultDto
        {
            ChapterId = chapterId,
            PriceCoins = price,
            CoinBalance = wallet.CoinBalance,
        };
    }

    public async Task<AuthorAgreementStatusDto> GetAuthorAgreementStatusAsync(string authorId)
    {
        var agreement = await EnsureActiveAgreementAsync();
        var acceptance = await _db.AuthorAgreementAcceptances
            .Where(item => item.AuthorId == authorId && item.Version == agreement.Version)
            .OrderByDescending(item => item.AcceptedAt)
            .FirstOrDefaultAsync();

        return new AuthorAgreementStatusDto
        {
            HasAccepted = acceptance != null,
            Version = agreement.Version,
            AcceptedAt = acceptance?.AcceptedAt,
            Title = agreement.Title,
            Body = agreement.Body,
        };
    }

    public async Task<AuthorAgreementStatusDto> AcceptAuthorAgreementAsync(string authorId)
    {
        var agreement = await EnsureActiveAgreementAsync();
        var exists = await _db.AuthorAgreementAcceptances
            .AnyAsync(item => item.AuthorId == authorId && item.Version == agreement.Version);

        if (!exists)
        {
            _db.AuthorAgreementAcceptances.Add(new AuthorAgreementAcceptance
            {
                AuthorId = authorId,
                AuthorAgreementId = agreement.ID,
                Version = agreement.Version,
                AcceptedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();
        }

        return await GetAuthorAgreementStatusAsync(authorId);
    }

    public async Task<AuthorEarningsDto> GetAuthorEarningsAsync(string authorId)
    {
        await MatureAuthorRoyaltiesAsync(authorId);
        var balance = await EnsureAuthorBalanceAsync(authorId);
        var royalties = await _db.RoyaltyLedgerEntries
            .Where(item => item.AuthorId == authorId)
            .OrderByDescending(item => item.CreatedAt)
            .Take(80)
            .Select(item => new RoyaltyLedgerEntryDto
            {
                Id = item.ID,
                BookId = item.BookId,
                ChapterId = item.ChapterId,
                GrossCoins = item.GrossCoins,
                AuthorCoins = item.AuthorCoins,
                PlatformCoins = item.PlatformCoins,
                EntryType = item.EntryType,
                Status = item.Status,
                AvailableAt = item.AvailableAt,
                CreatedAt = item.CreatedAt,
            })
            .ToListAsync();
        var payouts = await _db.PayoutRequests
            .Where(item => item.AuthorId == authorId)
            .OrderByDescending(item => item.RequestedAt)
            .Take(40)
            .Select(item => new PayoutRequestDto
            {
                Id = item.ID,
                AmountCoins = item.AmountCoins,
                Status = item.Status,
                Provider = item.Provider,
                RequestedAt = item.RequestedAt,
            })
            .ToListAsync();

        return new AuthorEarningsDto
        {
            PendingCoins = balance.PendingCoins,
            AvailableCoins = balance.AvailableCoins,
            WithdrawnCoins = balance.WithdrawnCoins,
            LifetimeCoins = balance.LifetimeCoins,
            Royalties = royalties,
            PayoutRequests = payouts,
        };
    }

    public async Task<PayoutRequestDto> RequestPayoutAsync(string authorId, CreatePayoutRequestDto dto)
    {
        if (dto.AmountCoins <= 0)
        {
            throw new InvalidOperationException("Payout amount must be greater than zero.");
        }

        await MatureAuthorRoyaltiesAsync(authorId);
        var balance = await EnsureAuthorBalanceAsync(authorId);
        if (balance.AvailableCoins < dto.AmountCoins)
        {
            throw new InvalidOperationException("Payout amount is higher than available earnings.");
        }

        balance.AvailableCoins -= dto.AmountCoins;
        balance.WithdrawnCoins += dto.AmountCoins;
        balance.UpdatedAt = DateTime.UtcNow;

        var payout = new PayoutRequest
        {
            AuthorId = authorId,
            AmountCoins = dto.AmountCoins,
            Status = "requested",
            Provider = "provider-adapter",
            ProviderReference = $"payout_{Guid.NewGuid():N}",
            RequestedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };

        _db.PayoutRequests.Add(payout);
        await _db.SaveChangesAsync();

        return new PayoutRequestDto
        {
            Id = payout.ID,
            AmountCoins = payout.AmountCoins,
            Status = payout.Status,
            Provider = payout.Provider,
            RequestedAt = payout.RequestedAt,
        };
    }

    private async Task<WalletAccount> EnsureWalletAsync(string userId)
    {
        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(item => item.UserId == userId);
        if (wallet != null) return wallet;

        wallet = new WalletAccount
        {
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.WalletAccounts.Add(wallet);
        await _db.SaveChangesAsync();
        return wallet;
    }

    private async Task<AuthorBalance> EnsureAuthorBalanceAsync(string authorId)
    {
        var balance = await _db.AuthorBalances.FirstOrDefaultAsync(item => item.AuthorId == authorId);
        if (balance != null) return balance;

        balance = new AuthorBalance
        {
            AuthorId = authorId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.AuthorBalances.Add(balance);
        await _db.SaveChangesAsync();
        return balance;
    }

    private async Task MatureAuthorRoyaltiesAsync(string authorId)
    {
        var now = DateTime.UtcNow;
        var matured = await _db.RoyaltyLedgerEntries
            .Where(item => item.AuthorId == authorId && item.Status == "pending" && item.AvailableAt <= now)
            .ToListAsync();

        if (!matured.Any()) return;

        var amount = matured.Sum(item => item.AuthorCoins);
        foreach (var item in matured)
        {
            item.Status = "available";
            item.UpdatedAt = now;
        }

        var balance = await EnsureAuthorBalanceAsync(authorId);
        balance.PendingCoins = Math.Max(0, balance.PendingCoins - amount);
        balance.AvailableCoins += amount;
        balance.UpdatedAt = now;
        await _db.SaveChangesAsync();
    }

    private async Task<AuthorAgreement> EnsureActiveAgreementAsync()
    {
        const string version = "monetization-v1";
        var agreement = await _db.AuthorAgreements.FirstOrDefaultAsync(item => item.Version == version);
        if (agreement != null) return agreement;

        agreement = new AuthorAgreement
        {
            Version = version,
            Title = "InkVerse Monetization Agreement",
            Body = "Authors earn 75% of net paid chapter revenue after fees, refunds, chargebacks, and taxes. Earnings are held for 14 days before withdrawal. InkVerse may process approved works for AI reader services. Reader-paid translation and TTS are InkVerse platform services.",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.AuthorAgreements.Add(agreement);
        await _db.SaveChangesAsync();
        return agreement;
    }

    private static int CalculateAuthorShare(int netCoins)
    {
        return (int)Math.Round(netCoins * (AuthorRoyaltyBasisPoints / 10000m), MidpointRounding.AwayFromZero);
    }

    private static string BuildTeaser(string? configuredTeaser, string? content)
    {
        if (!string.IsNullOrWhiteSpace(configuredTeaser))
        {
            return configuredTeaser.Trim();
        }

        var plain = StripHtml(content ?? string.Empty).Trim();
        if (plain.Length <= 260) return plain;
        return plain[..260].TrimEnd() + "...";
    }

    private static string StripHtml(string value)
    {
        var chars = new List<char>(value.Length);
        var insideTag = false;
        foreach (var character in value)
        {
            if (character == '<')
            {
                insideTag = true;
                continue;
            }
            if (character == '>')
            {
                insideTag = false;
                chars.Add(' ');
                continue;
            }
            if (!insideTag) chars.Add(character);
        }

        return new string(chars.ToArray()).Replace("&nbsp;", " ");
    }
}
