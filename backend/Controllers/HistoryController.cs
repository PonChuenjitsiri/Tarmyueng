using ExpenseTracker.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public HistoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPaymentHistory()
    {
        var payments = await _context.Payments
            .Include(p => p.BillShare)
                .ThenInclude(bs => bs.User)
            .Include(p => p.BillShare)
                .ThenInclude(bs => bs.MonthlyBill)
                    .ThenInclude(mb => mb.Template)
            .OrderByDescending(p => p.VerifiedAt)
            .Select(p => new {
                p.Id,
                p.VerifiedAmount,
                p.Status,
                p.VerifiedAt,
                p.BankTransactionRef,
                p.ReceiptImageUrl,
                BillName = p.BillShare.MonthlyBill.Template.Title,
                MonthYear = p.BillShare.MonthlyBill.MonthYear,
                AmountOwed = p.BillShare.AmountOwed,
                UserName = p.BillShare.User!.Username,
                UserEmail = p.BillShare.User!.Email
            })
            .ToListAsync();

        return Ok(payments);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserPaymentHistory(int userId)
    {
        var payments = await _context.Payments
            .Include(p => p.BillShare)
                .ThenInclude(bs => bs.MonthlyBill)
                    .ThenInclude(mb => mb.Template)
                        .ThenInclude(t => t.Admin)
            .Where(p => p.BillShare.UserId == userId)
            .OrderByDescending(p => p.VerifiedAt)
            .Select(p => new {
                p.Id,
                p.VerifiedAmount,
                p.Status,
                p.VerifiedAt,
                p.BankTransactionRef,
                p.ReceiptImageUrl,
                BillName = p.BillShare.MonthlyBill.Template.Title,
                MonthYear = p.BillShare.MonthlyBill.MonthYear,
                AdminName = p.BillShare.MonthlyBill.Template.Admin!.Username
            })
            .ToListAsync();

        return Ok(payments);
    }
}