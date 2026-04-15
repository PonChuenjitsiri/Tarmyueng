namespace ExpenseTracker.Api.Models;

public class Payment
{
    public int Id { get; set; }
    
    public int BillShareId { get; set; }
    public BillShare BillShare { get; set; } = null!;

    public string ReceiptImageUrl { get; set; } = string.Empty; 
    public string BankTransactionRef { get; set; } = string.Empty;
    
    public decimal? VerifiedAmount { get; set; }
    public string Status { get; set; } = "Pending";
    
    public DateTime? VerifiedAt { get; set; }
}