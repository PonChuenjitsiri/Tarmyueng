namespace ExpenseTracker.Api.Models;

public class MonthlyBill
{
    public int Id { get; set; }
    
    public int SubscriptionTemplateId { get; set; }
    public SubscriptionTemplate Template { get; set; } = null!;

    public string MonthYear { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<BillShare> BillShares { get; set; } = new();
}