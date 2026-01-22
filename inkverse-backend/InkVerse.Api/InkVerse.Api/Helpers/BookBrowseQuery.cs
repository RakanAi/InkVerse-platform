using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.Entities.Enums;

public class BookBrowseQuery
{
    // match frontend: verseType/originType/search/sortBy/isAscending/statuses/...
    [FromQuery(Name = "verseType")]
    public VerseType? VerseType { get; set; }

    [FromQuery(Name = "originType")]
    public OriginType? OriginType { get; set; }

    [FromQuery(Name = "search")]
    public string? SearchTerm { get; set; }

    [FromQuery(Name = "sortBy")]
    public string? SortBy { get; set; }

    [FromQuery(Name = "isAscending")]
    public bool? IsAscending { get; set; }

    [FromQuery(Name = "statuses")]
    public BookStatus[]? Statuses { get; set; }

    [FromQuery(Name = "minRating")]
    public double? MinRating { get; set; }

    [FromQuery(Name = "minReviewCount")]
    public int? MinReviewCount { get; set; }

    [FromQuery(Name = "genreIds")]
    public int[]? GenreIds { get; set; }

    [FromQuery(Name = "excludeGenreIds")]
    public int[]? ExcludeGenreIds { get; set; }

    [FromQuery(Name = "tagIds")]
    public int[]? TagIds { get; set; }

    [FromQuery(Name = "excludeTagIds")]
    public int[]? ExcludeTagIds { get; set; }

    [FromQuery(Name = "pageNumber")]
    public int PageNumber { get; set; } = 1;

    [FromQuery(Name = "pageSize")]
    public int PageSize { get; set; } = 20;

    public int? TrendId { get; set; }

    public TimeRange TimeRange { get; set; } = TimeRange.All;


}
