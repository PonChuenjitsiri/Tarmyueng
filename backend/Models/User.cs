namespace ExpenseTracker.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PromptPayId { get; set; } 
    
    // Subscriptions I am the Admin of
    public List<SubscriptionTemplate> AdminTemplates { get; set; } = new();

    // Subscriptions I am a participant in (and have to pay for)
    public List<SubscriptionParticipant> Participations { get; set; } = new();
}