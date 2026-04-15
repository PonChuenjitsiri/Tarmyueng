using ExpenseTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<SubscriptionTemplate> SubscriptionTemplates { get; set; }
    public DbSet<SubscriptionParticipant> SubscriptionParticipants { get; set; }
    public DbSet<MonthlyBill> MonthlyBills { get; set; }
    public DbSet<BillShare> BillShares { get; set; }
    public DbSet<Payment> Payments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Username = "admin", Email = "admin@tarmyueng.com", PasswordHash = "admin123", Role = "Admin" },
            new User { Id = 2, Username = "testuser", Email = "user@tarmyueng.com", PasswordHash = "user123", Role = "User" }
        );

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

        modelBuilder.Entity<MonthlyBill>()
            .HasOne(mb => mb.Template)
            .WithMany()
            .HasForeignKey(mb => mb.SubscriptionTemplateId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BillShare>()
            .HasOne(bs => bs.MonthlyBill)
            .WithMany(mb => mb.BillShares)
            .HasForeignKey(bs => bs.MonthlyBillId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.BankTransactionRef)
            .IsUnique();
    }
}