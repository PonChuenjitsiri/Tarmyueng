using ExpenseTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<SubscriptionTemplate> SubscriptionTemplates { get; set; }
    public DbSet<SubscriptionParticipant> SubscriptionParticipants { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SubscriptionTemplate>()
            .HasOne(t => t.Admin)
            .WithMany(u => u.AdminTemplates)
            .HasForeignKey(t => t.AdminId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SubscriptionParticipant>()
            .HasOne(p => p.User)
            .WithMany(u => u.Participations)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}