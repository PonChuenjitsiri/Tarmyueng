namespace ExpenseTracker.Api.Models;

public class BillShare
{
    public int Id { get; set; }
    
    public int MonthlyBillId { get; set; }
    public MonthlyBill MonthlyBill { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public decimal AmountOwed { get; set; }
    public string Status { get; set; } = "Unpaid"; 

    public Payment? Payment { get; set; }
}