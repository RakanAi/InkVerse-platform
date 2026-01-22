using InkVerse.Api.Entities.Base;

public class Genre
{
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public bool IsActive { get; set; }

    public ICollection<Book> Books { get; set; } = new List<Book>();

}
