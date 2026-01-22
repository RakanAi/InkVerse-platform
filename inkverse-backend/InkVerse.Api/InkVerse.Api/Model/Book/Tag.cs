using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Base;

public class Tag
{
    [Key]
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public ICollection<Book> Books { get; set; } = new List<Book>();
}
