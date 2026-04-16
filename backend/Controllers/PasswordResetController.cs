using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PasswordResetController : ControllerBase
{
    private readonly PasswordResetService _passwordResetService;
    private readonly AppDbContext _context;
    private readonly ILogger<PasswordResetController> _logger;

    public PasswordResetController(PasswordResetService passwordResetService, AppDbContext context, ILogger<PasswordResetController> logger)
    {
        _passwordResetService = passwordResetService;
        _context = context;
        _logger = logger;
    }

    [HttpPost("request")]
    [AllowAnonymous]
    public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
            return BadRequest(new { message = "Email is required" });

        try
        {
            // Look up user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            // For security, don't reveal if email exists - still return success
            if (user != null)
            {
                await _passwordResetService.SendPasswordResetEmailAsync(user.Id);
                _logger.LogInformation("Password reset email sent to {Email}", request.Email);
            }
            else
            {
                _logger.LogWarning("Password reset requested for non-existent email: {Email}", request.Email);
            }

            // Always return success to prevent email enumeration
            return Ok(new { message = "If an account exists with this email, a password reset link has been sent." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting password reset for email: {Email}", request.Email);
            // Return same message for security
            return Ok(new { message = "If an account exists with this email, a password reset link has been sent." });
        }
    }

    [HttpPost("validate-token")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateToken([FromBody] ValidateTokenRequest request)
    {
        if (string.IsNullOrEmpty(request.Token))
            return BadRequest(new { message = "Token is required" });

        var isValid = await _passwordResetService.ValidateResetTokenAsync(request.Token);
        return Ok(new { valid = isValid });
    }

    [HttpPost("reset")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
            return BadRequest(new { message = "Token and new password are required" });

        try
        {
            await _passwordResetService.ResetPasswordAsync(request.Token, request.NewPassword);
            return Ok(new { message = "Password has been reset successfully. You can now log in." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return StatusCode(500, new { message = "An error occurred while resetting password" });
        }
    }
}

public class RequestPasswordResetRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ValidateTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
