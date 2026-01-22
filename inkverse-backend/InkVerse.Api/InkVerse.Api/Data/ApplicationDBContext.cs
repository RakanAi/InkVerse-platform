using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Entities.TrendEnti;

namespace InkVerse.Api.Data
{
    public class InkVerseDB : IdentityDbContext<AppUser>
    {
        public InkVerseDB(DbContextOptions<InkVerseDB> options) : base(options)
        { }
        
        public DbSet<Book> Books { get; set; }
        public DbSet<Genre> Genres { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<UserLibrary> UserLibraries => Set<UserLibrary>();
        public DbSet<Review> Reviews { get; set; } 
        public DbSet<ChapterComment> ChapterComments { get; set; }
        public DbSet<ChapterCommentReaction> ChapterCommentReaction { get; set; }
        public DbSet<ReviewReaction> ReviewReaction { get; set; } 
        public DbSet<Chapter> Chapters { get; set; } 
        public DbSet<Trend> Trends { get; set; }
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<ReviewReply> ReviewReplies { get; set; }
        public DbSet<ReviewReplyReaction> ReviewReplyReactions { get; set; }

        public DbSet<ReadingProgress> ReadingProgress { get; set; } = null!;

        public DbSet<BookTrend> BookTrends => Set<BookTrend>();
        public DbSet<Arc> Arcs { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ✅ prevent multiple cascade paths
            builder.Entity<ReviewReplyReaction>()
                .HasOne(x => x.ReviewReply)
                .WithMany(r => r.Reactions)
                .HasForeignKey(x => x.ReviewReplyId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<ReviewReplyReaction>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<ReviewReply>()
                .HasOne(x => x.Review)
                .WithMany(r => r.Replies)
                .HasForeignKey(x => x.ReviewId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<ReviewReply>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<ReadingProgress>()
                .HasIndex(x => new { x.BookId, x.UserId })
                .IsUnique();

            builder.Entity<UserLibrary>()
                .HasOne(ul => ul.LastReadChapter)          // navigation property
                .WithMany()
                .HasForeignKey(ul => ul.LastReadChapterId)
                .OnDelete(DeleteBehavior.NoAction);         // or Restrict



            builder.Entity<ReadingProgress>()
    .HasOne(rp => rp.Book)
    .WithMany()
    .HasForeignKey(rp => rp.BookId)
    .OnDelete(DeleteBehavior.NoAction);





            builder.Entity<ChapterComment>()
    .HasOne(c => c.ParentComment)
    .WithMany(p => p.Replies)
    .HasForeignKey(c => c.ParentCommentId)
    .OnDelete(DeleteBehavior.NoAction); // prevents cascade path issues

            builder.Entity<ChapterComment>()
                .HasOne(c => c.Chapter)
                .WithMany()
                .HasForeignKey(c => c.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);

            // Reactions: one reaction per user per comment
            builder.Entity<ChapterCommentReaction>()
                .HasIndex(r => new { r.CommentId, r.UserId })
                .IsUnique();

            builder.Entity<ChapterCommentReaction>()
                .HasOne(r => r.Comment)
                .WithMany(c => c.Reactions)
                .HasForeignKey(r => r.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            // optional (good) - stop cascading from User deletes
            builder.Entity<ChapterComment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<ChapterCommentReaction>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<UserLibrary>()
            .HasIndex(x => new { x.UserId, x.BookId })
            .IsUnique();

            builder.Entity<BookTrend>()
            .HasKey(x => new { x.BookId, x.TrendID });

            builder.Entity<BookTrend>()
                .HasOne(x => x.Book)
                .WithMany(b => b.BookTrends)
                .HasForeignKey(x => x.BookId);

            builder.Entity<BookTrend>()
                .HasOne(x => x.Trend)
                .WithMany(t => t.BookTrends)
                .HasForeignKey(x => x.TrendID);

            builder.Entity<Trend>()
                .HasIndex(t => t.Name)
                .IsUnique();

            builder.Entity<Book>()
                .HasMany(b => b.Tags)
                .WithMany(t => t.Books)
                .UsingEntity(j => j.ToTable("BookTag"));

            builder.Entity<Book>()
                .HasMany(b => b.Genres)
                .WithMany(g => g.Books)
                .UsingEntity(j => j.ToTable("BookGenre"));
            builder.Entity<Chapter>()
                .HasIndex(c => new { c.BookId, c.ChapterNumber })
                .IsUnique();
            builder.Entity<ReadingProgress>()
                .HasOne(rp => rp.Chapter)
                .WithMany() // or .WithMany(c => c.ReadingProgresses) if you have navigation
                .HasForeignKey(rp => rp.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Chapter>()
                  .HasIndex(c => new { c.BookId, c.ChapterNumber })
                  .IsUnique();

            builder.Entity<Genre>().HasData(
    new Genre { ID = 1, Name = "Fantasy", IsActive = true },
    new Genre { ID = 2, Name = "Romance", IsActive = true },
    new Genre { ID = 3, Name = "Sci-Fi", IsActive = true },
    new Genre { ID = 4, Name = "Urban", IsActive = true },
    new Genre { ID = 5, Name = "Mystery", IsActive = true },
    new Genre { ID = 6, Name = "Horror", IsActive = true },
    new Genre { ID = 7, Name = "Historical", IsActive = true },
    new Genre { ID = 8, Name = "Adventure", IsActive = true },
    new Genre { ID = 9, Name = "Realistic", IsActive = true },
    new Genre { ID = 10, Name = "Non-Fiction", IsActive = true },
    new Genre { ID = 11, Name = "Fanfiction", IsActive = true }
);

            builder.Entity<Tag>().HasData(
    new Tag { ID = 1, Name = "Action", IsActive = true },
    new Tag { ID = 2, Name = "Comedy", IsActive = true },
    new Tag { ID = 3, Name = "Drama", IsActive = true },
    new Tag { ID = 4, Name = "Thriller", IsActive = true },
    new Tag { ID = 5, Name = "Slice of Life", IsActive = true },
    new Tag { ID = 6, Name = "Martial Arts", IsActive = true },
    new Tag { ID = 7, Name = "Cultivation", IsActive = true },
    new Tag { ID = 8, Name = "Eastern Fantasy", IsActive = true },
    new Tag { ID = 9, Name = "Western Fantasy", IsActive = true },
    new Tag { ID = 10, Name = "Game Elements", IsActive = true },
    new Tag { ID = 11, Name = "System", IsActive = true },
    new Tag { ID = 12, Name = "LitRPG", IsActive = true },
    new Tag { ID = 13, Name = "Isekai", IsActive = true },
    new Tag { ID = 14, Name = "Reincarnation", IsActive = true },
    new Tag { ID = 15, Name = "Transmigration", IsActive = true },
    new Tag { ID = 16, Name = "Time Travel", IsActive = true },
    new Tag { ID = 17, Name = "Modern Day", IsActive = true },
    new Tag { ID = 18, Name = "Wuxia", IsActive = true },
    new Tag { ID = 19, Name = "Xianxia", IsActive = true },
    new Tag { ID = 20, Name = "Xuanhuan", IsActive = true },
    new Tag { ID = 21, Name = "Superpowers", IsActive = true },
    new Tag { ID = 22, Name = "Magic", IsActive = true },
    new Tag { ID = 23, Name = "Alchemy", IsActive = true },
    new Tag { ID = 24, Name = "Beasts", IsActive = true },
    new Tag { ID = 25, Name = "Dungeons", IsActive = true },
    new Tag { ID = 26, Name = "Kingdom Building", IsActive = true },
    new Tag { ID = 27, Name = "Harem", IsActive = true },
    new Tag { ID = 28, Name = "Reverse Harem", IsActive = true },
    new Tag { ID = 29, Name = "Yaoi (BL)", IsActive = true },
    new Tag { ID = 30, Name = "Yuri (GL)", IsActive = true },
    new Tag { ID = 31, Name = "Smut", IsActive = true },
    new Tag { ID = 32, Name = "Adult", IsActive = true },
    new Tag { ID = 33, Name = "R-18", IsActive = true },
    new Tag { ID = 34, Name = "Psychological", IsActive = true },
    new Tag { ID = 35, Name = "Tragedy", IsActive = true },
    new Tag { ID = 36, Name = "Antihero", IsActive = true },
    new Tag { ID = 37, Name = "Overpowered", IsActive = true },
    new Tag { ID = 38, Name = "Weak to Strong", IsActive = true },
    new Tag { ID = 39, Name = "Villain MC", IsActive = true },
    new Tag { ID = 40, Name = "Female Lead", IsActive = true },
    new Tag { ID = 41, Name = "Male Lead", IsActive = true },
    new Tag { ID = 42, Name = "Child Protagonist", IsActive = true },
    new Tag { ID = 43, Name = "Non-Human Protagonist", IsActive = true },
    new Tag { ID = 44, Name = "Monster MC", IsActive = true },
    new Tag { ID = 45, Name = "Vampires", IsActive = true },
    new Tag { ID = 46, Name = "Werewolves", IsActive = true },
    new Tag { ID = 47, Name = "Demons", IsActive = true },
    new Tag { ID = 48, Name = "Angels", IsActive = true },
    new Tag { ID = 49, Name = "Gods", IsActive = true },
    new Tag { ID = 50, Name = "Revenge", IsActive = true },
    new Tag { ID = 51, Name = "Romantic Subplot", IsActive = true },
    new Tag { ID = 52, Name = "Slow Burn", IsActive = true },
    new Tag { ID = 53, Name = "Fast Paced", IsActive = true },
    new Tag { ID = 54, Name = "Cold MC", IsActive = true },
    new Tag { ID = 55, Name = "Shameless MC", IsActive = true },
    new Tag { ID = 56, Name = "Smart MC", IsActive = true },
    new Tag { ID = 57, Name = "Evil MC", IsActive = true },
    new Tag { ID = 58, Name = "Kind MC", IsActive = true },
    new Tag { ID = 59, Name = "Guilds", IsActive = true },
    new Tag { ID = 60, Name = "Empires", IsActive = true },
    new Tag { ID = 61, Name = "School Life", IsActive = true },
    new Tag { ID = 62, Name = "Magic Academy", IsActive = true },
    new Tag { ID = 63, Name = "Clans", IsActive = true },
    new Tag { ID = 64, Name = "Sect", IsActive = true },
    new Tag { ID = 65, Name = "Apocalypse", IsActive = true },
    new Tag { ID = 66, Name = "Zombie", IsActive = true },
    new Tag { ID = 67, Name = "Cyberpunk", IsActive = true },
    new Tag { ID = 68, Name = "Steampunk", IsActive = true },
    new Tag { ID = 69, Name = "Futuristic", IsActive = true },
    new Tag { ID = 70, Name = "Virtual Reality", IsActive = true },
    new Tag { ID = 71, Name = "AI", IsActive = true },
    new Tag { ID = 72, Name = "Multiverse", IsActive = true },
    new Tag { ID = 73, Name = "Parallel Worlds", IsActive = true },
    new Tag { ID = 74, Name = "Tower Climbing", IsActive = true },
    new Tag { ID = 75, Name = "Trials", IsActive = true },
    new Tag { ID = 76, Name = "Quests", IsActive = true },
    new Tag { ID = 77, Name = "Crafting", IsActive = true },
    new Tag { ID = 78, Name = "Politics", IsActive = true },
    new Tag { ID = 79, Name = "Espionage", IsActive = true },
    new Tag { ID = 80, Name = "Military", IsActive = true },
    new Tag { ID = 81, Name = "Survival", IsActive = true },
    new Tag { ID = 82, Name = "Dark", IsActive = true },
    new Tag { ID = 83, Name = "Lighthearted", IsActive = true },
    new Tag { ID = 84, Name = "Parody", IsActive = true },
    new Tag { ID = 85, Name = "Original Story", IsActive = true }
);

        }



}
}
