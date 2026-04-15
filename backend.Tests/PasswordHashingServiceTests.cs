using ExpenseTracker.Api.Services;
using Xunit;

namespace ExpenseTracker.Api.Tests;

public class PasswordHashingServiceTests
{
    private readonly IPasswordHashingService _service = new PasswordHashingService();

    [Fact]
    public void HashPassword_ShouldReturnHashedPassword()
    {
        var password = "MySecurePassword123!";

        var hash = _service.HashPassword(password);

        Assert.NotNull(hash);
        Assert.NotEqual(password, hash); 
        Assert.True(hash.Length > 50); 
    }

    [Fact]
    public void HashPassword_SamePasswordProducesDifferentHashes()
    {
        var password = "MySecurePassword123!";

        var hash1 = _service.HashPassword(password);
        var hash2 = _service.HashPassword(password);

        Assert.NotEqual(hash1, hash2); 
    }

    [Fact]
    public void VerifyPassword_CorrectPassword_ReturnsTrue()
    {
        var password = "MySecurePassword123!";
        var hash = _service.HashPassword(password);

        var result = _service.VerifyPassword(password, hash);

        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_IncorrectPassword_ReturnsFalse()
    {
        var password = "MySecurePassword123!";
        var wrongPassword = "WrongPassword456!";
        var hash = _service.HashPassword(password);

        var result = _service.VerifyPassword(wrongPassword, hash);

        Assert.False(result);
    }

    [Fact]
    public void VerifyPassword_InvalidHash_ReturnsFalse()
    {
        var password = "MySecurePassword123!";
        var invalidHash = "not-a-valid-hash";

        var result = _service.VerifyPassword(password, invalidHash);

        Assert.False(result);
    }

    [Fact]
    public void VerifyPassword_EmptyPassword_ReturnsFalse()
    {
        var password = "MySecurePassword123!";
        var hash = _service.HashPassword(password);

        var result = _service.VerifyPassword(string.Empty, hash);

        Assert.False(result);
    }
}
