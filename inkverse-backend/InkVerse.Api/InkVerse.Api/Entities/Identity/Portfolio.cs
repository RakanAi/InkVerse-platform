using InkVerse.Api.Entities.Identity;

public class Portfolio
{
    public int ID { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public AppUser Author { get; set; } = null!;

    public List<Book> Books { get; set; } = new();
}
