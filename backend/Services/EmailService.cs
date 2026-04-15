using System.Net;
using System.Net.Mail;

namespace ExpenseTracker.Api.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
    {
        try
        {
            var smtpHost = _config["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
            var senderEmail = _config["Email:SenderEmail"] ?? "noreply@tarmyueng.com";
            var senderPassword = _config["Email:SenderPassword"] ?? "";

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                Timeout = 10000
            };

            var subject = "Tarmyueng - Set Your Password";
            var body = $@"
                <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2>Welcome to Tarmyueng!</h2>
                        <p>Hi {userName},</p>
                        <p>You've been added as a user. Please set your password by clicking the link below:</p>
                        <p style='margin-top: 20px;'>
                            <a href='{resetLink}' style='background-color: #5865f2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                                Set Password
                            </a>
                        </p>
                        <p>Or copy this link: <br/><code>{resetLink}</code></p>
                        <p style='color: #666; font-size: 12px; margin-top: 30px;'>
                            This link expires in 24 hours. If you didn't request this, please ignore this email.
                        </p>
                    </body>
                </html>";

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, "Tarmyueng"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Password reset email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string userName, string resetLink)
    {
        await SendPasswordResetEmailAsync(toEmail, userName, resetLink);
    }
}
