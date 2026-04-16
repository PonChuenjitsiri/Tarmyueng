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
        var currentDay = localNow.Day;

        _logger.LogInformation("=== BILLING ENGINE CHECK === Date: {Date}, Day: {Day}, MonthYear: {MonthYear}", localNow.ToString("yyyy-MM-dd HH:mm:ss"), currentDay, currentMonthYear);

        var allSubscriptions = await _context.SubscriptionTemplates.ToListAsync();
        _logger.LogInformation("Total subscriptions in DB: {Count}", allSubscriptions.Count);
        foreach (var sub in allSubscriptions)
        {
            _logger.LogInformation("  - {Title}: IsActive={IsActive}, BillingDay={BillingDay}", sub.Title, sub.IsActive, sub.BillingDayOfMonth);
        }

        var subscriptionsToBill = await _context.SubscriptionTemplates
            .Include(s => s.Participants)
            .Where(s => s.IsActive && s.BillingDayOfMonth == currentDay)
            .ToListAsync();

        _logger.LogInformation("Subscriptions to bill today: {Count}", subscriptionsToBill.Count);

        if (!subscriptionsToBill.Any())
        {
            _logger.LogInformation("No active subscriptions with billing day = {Day}", currentDay);
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