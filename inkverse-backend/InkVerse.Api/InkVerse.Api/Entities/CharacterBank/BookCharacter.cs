namespace InkVerse.Api.Entities.CharacterBank
{
    public class BookCharacter
    {
        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public int CharacterTemplateId { get; set; }
        public CharacterTemplate CharacterTemplate { get; set; } = null!;

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
