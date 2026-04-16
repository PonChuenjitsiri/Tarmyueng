using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("user-debt-summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUserDebtSummary()
    {
        var userDebtSummary = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.PromptPayId,
                TotalDebt = _context.BillShares
                    .Where(bs => bs.UserId == u.Id && bs.Status != "Paid")
                    .Sum(bs => bs.AmountOwed),
                TotalPaid = _context.Payments
                    .Where(p => _context.BillShares
                        .Where(bs => bs.UserId == u.Id)
                        .Select(bs => bs.Id)
                        .Contains(p.BillShareId))
                    .Sum(p => p.VerifiedAmount),
                UnpaidBillCount = _context.BillShares
                    .Where(bs => bs.UserId == u.Id && bs.Status != "Paid")
                    .Count(),
                PaidBillCount = _context.BillShares
                    .Where(bs => bs.UserId == u.Id && bs.Status == "Paid")
                    .Count()
            })
            .OrderByDescending(u => u.TotalDebt)
            .ToListAsync();

        return Ok(userDebtSummary);
    }

    [HttpGet("user/{userId}/debt-detail")]
    [Authorize]
    public async Task<IActionResult> GetUserDebtDetail(int userId)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUser = await _context.Users.FindAsync(int.Parse(currentUserId ?? "0"));

        // Users can see their own debt, admins can see all
        if (currentUser?.Role != "Admin" && currentUserId != userId.ToString())
        {
            return Forbid();
        }

        var userDebtDetail = await _context.BillShares
            .Include(bs => bs.MonthlyBill)
                .ThenInclude(mb => mb.Template)
            .Include(bs => bs.Payment)
            .Where(bs => bs.UserId == userId)
            .Select(bs => new
            {
                bs.Id,
                bs.UserId,
                bs.AmountOwed,
                bs.Status,
                MonthYear = bs.MonthlyBill.MonthYear,
                BillName = bs.MonthlyBill.Template.Title,
                CreatedAt = bs.MonthlyBill.CreatedAt,
                Payment = bs.Payment == null ? null : new
                {
                    bs.Payment.Status,
                    bs.Payment.VerifiedAmount,
                    bs.Payment.VerifiedAt,
                    bs.Payment.BankTransactionRef,
                    bs.Payment.ReceiptImageUrl
                }
            })
            .OrderByDescending(bs => bs.CreatedAt)
            .ToListAsync();

        return Ok(userDebtDetail);
    }

    [HttpGet("bills-by-subscription")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetBillsBySubscription()
    {
        var billsGrouped = await _context.SubscriptionTemplates
            .Include(s => s.Participants)
                .ThenInclude(p => p.User)
            .Select(s => new
            {
                s.Id,
                s.Title,
                s.TotalAmount,
                s.IsActive,
                BillingDayOfMonth = s.BillingDayOfMonth,
                AdminId = s.AdminId,
                ParticipantCount = s.Participants.Count,
                Bills = _context.MonthlyBills
                    .Where(mb => mb.SubscriptionTemplateId == s.Id)
                    .OrderByDescending(mb => mb.CreatedAt)
                    .Select(mb => new
                    {
                        mb.Id,
                        mb.MonthYear,
                        mb.TotalAmount,
                        mb.CreatedAt,
                        TotalPaid = mb.BillShares
                            .Where(bs => bs.Status == "Paid")
                            .Count(),
                        TotalUnpaid = mb.BillShares
                            .Where(bs => bs.Status != "Paid")
                            .Count(),
                        Shares = mb.BillShares
                            .Select(bs => new
                            {
                                bs.Id,
                                bs.UserId,
                                UserName = bs.User.Username,
                                UserEmail = bs.User.Email,
                                bs.AmountOwed,
                                bs.Status,
                                Payment = bs.Payment == null ? null : new
                                {
                                    bs.Payment.Status,
                                    bs.Payment.VerifiedAmount,
                                    bs.Payment.VerifiedAt
                                }
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .OrderBy(s => s.Title)
            .ToListAsync();

        return Ok(billsGrouped);
    }

    [HttpGet("user-subscriptions")]
    public async Task<IActionResult> GetUserSubscriptions()
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(currentUserId ?? "0");

        var userSubscriptions = await _context.SubscriptionParticipants
            .Where(sp => sp.UserId == userId)
            .Include(sp => sp.Template)
                .ThenInclude(t => t!.Admin)
            .Include(sp => sp.Template)
                .ThenInclude(t => t!.Participants)
            .Select(sp => new
            {
                sp.Template!.Id,
                sp.Template.Title,
                AdminUsername = sp.Template.Admin!.Username,
                sp.Template.BillingDayOfMonth,
                sp.Template.IsActive,
                sp.Template.TotalAmount,
                ParticipantCount = sp.Template.Participants.Count,
                NextBill = _context.MonthlyBills
                    .Where(mb => mb.SubscriptionTemplateId == sp.Template.Id)
                    .OrderByDescending(mb => mb.CreatedAt)
                    .Select(mb => new
                    {
                        mb.MonthYear,
                        AmountOwed = _context.BillShares
                            .Where(bs => bs.MonthlyBillId == mb.Id && bs.UserId == userId && bs.Status != "Paid")
                            .Sum(bs => bs.AmountOwed)
                    })
                    .FirstOrDefault()
            })
            .Distinct()
            .OrderBy(s => s.Title)
            .ToListAsync();

        return Ok(userSubscriptions);
    }

    [HttpGet("dashboard-stats")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalDebt = await _context.BillShares
            .Where(bs => bs.Status != "Paid")
            .SumAsync(bs => bs.AmountOwed);
        var totalPaidNullable = await _context.Payments
            .SumAsync(p => p.VerifiedAmount);
        var totalPaid = totalPaidNullable ?? 0m;

        var activeSubscriptions = await _context.SubscriptionTemplates
            .CountAsync(s => s.IsActive);
        var unpaidBills = await _context.BillShares
            .CountAsync(bs => bs.Status != "Paid");
        var paidBills = await _context.BillShares
            .CountAsync(bs => bs.Status == "Paid");

        return Ok(new
        {
            TotalUsers = totalUsers,
            TotalDebt = totalDebt,
            TotalPaid = totalPaid,
            ActiveSubscriptions = activeSubscriptions,
            UnpaidBills = unpaidBills,
            PaidBills = paidBills,
            PaidPercentage = totalPaid + totalDebt > 0
                ? Math.Round((totalPaid / (totalPaid + totalDebt)) * 100, 2)
                : 0
        });
    }
}
