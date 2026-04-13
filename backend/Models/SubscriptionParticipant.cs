namespace ExpenseTracker.Api.Models;

public class SubscriptionParticipant
{
    public int Id { get; set; }
    
    public int SubscriptionTemplateId { get; set; }
    public SubscriptionTemplate Template { get; set; } = null!;

    public int UserId { get; set; } // The friend who owes money
    public User User { get; set; } = null!;

    public decimal DefaultAmountOwed { get; set; } // e.g., 105 THB
}