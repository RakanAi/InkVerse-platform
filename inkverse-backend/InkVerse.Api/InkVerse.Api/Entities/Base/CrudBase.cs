using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InkVerse.Api.Entities.Base
{
    public class CrudBase
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }
        public string? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; } 

        // Optional: Soft delete
        public bool IsDeleted { get; set; } = false;

    }
}
