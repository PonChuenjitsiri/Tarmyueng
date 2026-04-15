using System.Text.Json.Serialization;

namespace ExpenseTracker.Api.Models;

public class SubscriptionTemplate
{
    public int Id { get; set; }
    public int AdminId { get; set; } 
    public string Title { get; set; } = string.Empty; 
    public decimal TotalAmount { get; set; }
    public int BillingDayOfMonth { get; set; } 
    public bool IsActive { get; set; } = true;

    [JsonIgnore]
    public User? Admin { get; set; }
    
    public List<SubscriptionParticipant> Participants { get; set; } = new();
}