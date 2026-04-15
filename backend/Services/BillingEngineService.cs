using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Services;

public class BillingEngineService
{
    private readonly AppDbContext _context;
    private readonly ILogger<BillingEngineService> _logger;

    public BillingEngineService(AppDbContext context, ILogger<BillingEngineService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task GenerateMonthlyBillsAsync()
    {
        var localNow = DateTime.Now;  
        var utcNow = DateTime.UtcNow;  
        var currentMonthYear = localNow.ToString("MM-yyyy");

        _logger.LogInformation("Starting Monthly Billing Engine for {MonthYear} (Local day: {Day})...", currentMonthYear, localNow.Day);

        var subscriptionsToBill = await _context.SubscriptionTemplates
            .Include(s => s.Participants)
            .Where(s => s.IsActive && s.BillingDayOfMonth == localNow.Day)
            .ToListAsync();

        if (!subscriptionsToBill.Any())
        {
            _logger.LogInformation("No active subscriptions found for day {Day}.", localNow.Day);
            return;
        }

        foreach (var template in subscriptionsToBill)
        {
            var existingBill = await _context.MonthlyBills
                .FirstOrDefaultAsync(mb => mb.SubscriptionTemplateId == template.Id && mb.MonthYear == currentMonthYear);

            if (existingBill != null)
            {
                _logger.LogWarning("Bill already exists for Template {TemplateId} for {MonthYear}. Skipping.", template.Id, currentMonthYear);
                continue;
            }

            var newBill = new MonthlyBill
            {
                SubscriptionTemplateId = template.Id,
                MonthYear = currentMonthYear,
                TotalAmount = template.TotalAmount,
                CreatedAt = utcNow,  
                BillShares = new List<BillShare>()
            };

            foreach (var participant in template.Participants)
            {
                newBill.BillShares.Add(new BillShare
                {
                    UserId = participant.UserId,
                    AmountOwed = participant.DefaultAmountOwed,
                    Status = "Unpaid"
                });
            }

            _context.MonthlyBills.Add(newBill);
            _logger.LogInformation("Generated bill for Template {TemplateId} with {ParticipantCount} shares.", template.Id, template.Participants.Count);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Billing Engine completed successfully.");
    }
}