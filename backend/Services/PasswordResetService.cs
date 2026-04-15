using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Services;

public class PasswordResetService
{
    private readonly AppDbContext _context;
    private readonly IPasswordHashingService _hashingService;
    private readonly EmailService _emailService;
    private readonly ILogger<PasswordResetService> _logger;
    private readonly IConfiguration _config;

    public PasswordResetService(
        AppDbContext context,
        IPasswordHashingService hashingService,
        EmailService emailService,
        ILogger<PasswordResetService> logger,
        IConfiguration config)
    {
        _context = context;
        _hashingService = hashingService;
        _emailService = emailService;
        _logger = logger;
        _config = config;
    }

    public async Task<string> GeneratePasswordResetTokenAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        // Invalidate old reset tokens
        var oldTokens = await _context.PasswordResets
            .Where(pr => pr.UserId == userId && !pr.IsUsed)
            .ToListAsync();
        _context.PasswordResets.RemoveRange(oldTokens);

        // Generate new token
        var token = GenerateRandomToken();
        var resetRecord = new PasswordReset
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        };

        _context.PasswordResets.Add(resetRecord);
        await _context.SaveChangesAsync();

        // Build reset link
        var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:5174";
        var resetLink = $"{baseUrl}/reset-password?token={token}";

        return resetLink;
    }

    public async Task SendPasswordResetEmailAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var resetLink = await GeneratePasswordResetTokenAsync(userId);
        await _emailService.SendPasswordResetEmailAsync(user.Email, user.Username, resetLink);
    }

    public async Task<bool> ValidateResetTokenAsync(string token)
    {
        var resetRecord = await _context.PasswordResets
            .FirstOrDefaultAsync(pr => pr.Token == token && !pr.IsUsed && pr.ExpiresAt > DateTime.UtcNow);

        return resetRecord != null;
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        if (string.IsNullOrEmpty(newPassword) || newPassword.Length < 6)
            throw new InvalidOperationException("Password must be at least 6 characters");

        var resetRecord = await _context.PasswordResets
            .Include(pr => pr.User)
            .FirstOrDefaultAsync(pr => pr.Token == token && !pr.IsUsed && pr.ExpiresAt > DateTime.UtcNow);

        if (resetRecord == null)
            throw new InvalidOperationException("Invalid or expired reset token");

        // Update password
        var user = resetRecord.User!;
        user.PasswordHash = _hashingService.HashPassword(newPassword);
        user.IsActive = true;

        // Mark token as used
        resetRecord.IsUsed = true;

        _context.Users.Update(user);
        _context.PasswordResets.Update(resetRecord);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Password reset successful for user {UserId}", user.Id);
        return true;
    }

    private string GenerateRandomToken()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        var token = new string(Enumerable.Range(0, 32).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(token + DateTime.UtcNow.Ticks));
    }
}
