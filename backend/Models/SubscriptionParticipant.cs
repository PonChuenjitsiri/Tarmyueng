using System.Text.Json.Serialization;

namespace ExpenseTracker.Api.Models;

public class SubscriptionParticipant
{
    public int Id { get; set; }
    
    public int SubscriptionTemplateId { get; set; }
    [JsonIgnore]
    public SubscriptionTemplate? Template { get; set; }

    public int UserId { get; set; }
    [JsonIgnore]
    public User? User { get; set; }

    public decimal DefaultAmountOwed { get; set; }
}