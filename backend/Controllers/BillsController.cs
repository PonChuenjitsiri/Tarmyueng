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
public class BillsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BillsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserBills(int userId)
    {
        var bills = await _context.BillShares
            .Include(bs => bs.MonthlyBill)
                .ThenInclude(mb => mb.Template)
                    .ThenInclude(t => t.Admin)
            .Where(bs => bs.UserId == userId && bs.Status != "Paid")
            .Select(bs => new {
                bs.Id,
                bs.AmountOwed,
                bs.Status,
                MonthlyBill = new {
                    bs.MonthlyBill.MonthYear,
                    Template = new {
                        bs.MonthlyBill.Template.Title,
                        Admin = new {
                            bs.MonthlyBill.Template.Admin!.Username,
                            bs.MonthlyBill.Template.Admin.PromptPayId
                        }
                    }
                }
            })
            .ToListAsync();

        return Ok(bills);
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllBills()
    {
        var bills = await _context.BillShares
            .Include(bs => bs.User)
            .Include(bs => bs.MonthlyBill)
                .ThenInclude(mb => mb.Template)
            .Include(bs => bs.Payment)
            .OrderByDescending(bs => bs.MonthlyBill.CreatedAt)
            .Select(bs => new {
                bs.Id,
                bs.AmountOwed,
                bs.Status,
                UserName = bs.User!.Username,
                UserEmail = bs.User!.Email,
                BillName = bs.MonthlyBill.Template.Title,
                MonthYear = bs.MonthlyBill.MonthYear,
                CreatedAt = bs.MonthlyBill.CreatedAt,
                Payment = bs.Payment == null ? null : new {
                    bs.Payment.Status,
                    bs.Payment.VerifiedAt,
                    bs.Payment.VerifiedAmount,
                    bs.Payment.BankTransactionRef,
                    bs.Payment.ReceiptImageUrl
                }
            })
            .ToListAsync();

        return Ok(bills);
    }

    [HttpPost("admin/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminAssignBill([FromBody] AssignBillRequest request)
    {
        var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var template = await _context.SubscriptionTemplates.FirstOrDefaultAsync(t => t.Title == request.Title && t.AdminId == adminId);
        if (template == null)
        {
            template = new SubscriptionTemplate
            {
                AdminId = adminId,
                Title = request.Title,
                TotalAmount = request.Amount,
                BillingDayOfMonth = DateTime.UtcNow.Day,
                IsActive = true
            };
            _context.SubscriptionTemplates.Add(template);
            await _context.SaveChangesAsync();
        }

        var bill = new MonthlyBill
        {
            SubscriptionTemplateId = template.Id,
            MonthYear = request.MonthYear,
            TotalAmount = request.Amount,
            DueDate = string.IsNullOrEmpty(request.DueDate) ? null : DateTime.Parse(request.DueDate),
            CreatedAt = DateTime.UtcNow
        };
        _context.MonthlyBills.Add(bill);
        await _context.SaveChangesAsync();

        var share = new BillShare
        {
            MonthlyBillId = bill.Id,
            UserId = request.UserId,
            AmountOwed = request.Amount,
            Status = "Unpaid"
        };
        _context.BillShares.Add(share);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Bill successfully assigned to user", billShareId = share.Id });
    }
}

public class AssignBillRequest
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string MonthYear { get; set; } = string.Empty;
    public string? DueDate { get; set; }
}