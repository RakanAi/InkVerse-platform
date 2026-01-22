using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

public class Review : CrudBase
{
    public int BookId { get; set; }
    [ForeignKey("BookId")]
    public Book? Book { get; set; }

    public string? UserId { get; set; }
    [ForeignKey("UserId")]
    public AppUser? User { get; set; }

    // ✅ computed overall rating
    public double Rating { get; set; }

    // ✅ main review body (use this)
    public string? Content { get; set; }

    // Optional title (keep if you like it)
    public string? ReviewTitle { get; set; }

    // ❌ redundant — recommend removing later
    // public string? ReviewText { get; set; }

    // ✅ Fanfic breakdown (0..5)
    public double CharacterAccuracy { get; set; }
    public double ChemistryRelationships { get; set; }
    public double PlotCreativity { get; set; }
    public double CanonIntegration { get; set; }

    // ✅ Special: 1 = maximum damage, 5 = no damage
    public double EmotionalDamage { get; set; }

    // Navigation to reactions
    public ICollection<ReviewReaction> Reactions { get; set; } = new List<ReviewReaction>();
    public ICollection<ReviewReply> Replies { get; set; } = new List<ReviewReply>();

}
