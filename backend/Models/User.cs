using System.Text.Json.Serialization;

namespace ExpenseTracker.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
    public string? PromptPayId { get; set; }
    public bool IsActive { get; set; } = true;

    public string Role { get; set; } = "User"; 
    
    [JsonIgnore]
    public List<SubscriptionTemplate> AdminTemplates { get; set; } = new();

    [JsonIgnore]
    public List<SubscriptionParticipant> Participations { get; set; } = new();
}