using Microsoft.EntityFrameworkCore;
using Knitted.Api.Models;

namespace Knitted.Api.Data
{
    public class KnittedDbContext : DbContext
    {
        public KnittedDbContext(DbContextOptions<KnittedDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Booking> Bookings => Set<Booking>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.PasswordHash).HasMaxLength(512);
                entity.Property(u => u.OAuthProvider).HasMaxLength(50);
                entity.Property(u => u.OAuthProviderKey).HasMaxLength(256);
            });

            // Configure Event entity
            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.TotalCapacity).IsRequired();
                entity.Property(e => e.AvailableTickets).IsRequired();
            });

            // Configure Booking entity
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasKey(b => b.Id);
                entity.Property(b => b.BookedAt).IsRequired();

                // Relationship: User -> Bookings
                entity.HasOne(b => b.User)
                      .WithMany(u => u.Bookings)
                      .HasForeignKey(b => b.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Relationship: Event -> Bookings
                entity.HasOne(b => b.Event)
                      .WithMany(e => e.Bookings)
                      .HasForeignKey(b => b.EventId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
