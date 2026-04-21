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
    public double Rating { get; set; }
    public string? Content { get; set; }
    public string? ReviewTitle { get; set; }
    public double CharacterAccuracy { get; set; }
    public double ChemistryRelationships { get; set; }
    public double PlotCreativity { get; set; }
    public double CanonIntegration { get; set; }
    public double EmotionalDamage { get; set; }
    public string? AiClassification { get; set; }
    public string? AiReason { get; set; }
    public DateTime? AiAnalyzedAt { get; set; }
    public ICollection<ReviewReaction> Reactions { get; set; } = new List<ReviewReaction>();
    public ICollection<ReviewReply> Replies { get; set; } = new List<ReviewReply>();

}
