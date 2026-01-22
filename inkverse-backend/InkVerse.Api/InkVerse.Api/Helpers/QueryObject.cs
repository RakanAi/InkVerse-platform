namespace InkVerse.Api.Helpers
{
    public class QueryObject
    {
        public string? BookName { get; set; }
        public string? SearchTerm { get; set; }  // if you're using this in GetAllBooksAsync
        public string? SortBy { get; set; }// Default sort
        public bool? IsAscending { get; set; } // Default sort order
        public bool? IsDescending { get; set; } // Default sort order
        public int PageNumber { get; set; } = 1; // Default page number
        public int PageSize { get; set; } = 50; // Default page size

    }
}
