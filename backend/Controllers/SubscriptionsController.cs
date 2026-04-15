using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SubscriptionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SubscriptionTemplate>>> GetSubscriptions()
    {
        return await _context.SubscriptionTemplates
            .Include(s => s.Admin)
            .Include(s => s.Participants)
                .ThenInclude(p => p.User)
            .ToListAsync();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SubscriptionTemplate>> CreateSubscription(SubscriptionTemplate template)
    {
        _context.SubscriptionTemplates.Add(template);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSubscriptions), new { id = template.Id }, template);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSubscription(int id, [FromBody] UpdateSubscriptionRequest request)
    {
        var subscription = await _context.SubscriptionTemplates.FindAsync(id);
        if (subscription == null)
            return NotFound(new { message = "Subscription not found" });

        subscription.Title = request.Title ?? subscription.Title;
        subscription.TotalAmount = request.TotalAmount ?? subscription.TotalAmount;
        subscription.BillingDayOfMonth = request.BillingDayOfMonth ?? subscription.BillingDayOfMonth;
        subscription.IsActive = request.IsActive ?? subscription.IsActive;

        _context.SubscriptionTemplates.Update(subscription);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Subscription updated successfully", subscription });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSubscription(int id)
    {
        var subscription = await _context.SubscriptionTemplates.FindAsync(id);

        if (subscription == null)
            return NotFound(new { message = "Subscription not found" });

        _context.SubscriptionTemplates.Remove(subscription);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Subscription deleted successfully" });
    }
}

public class UpdateSubscriptionRequest
{
    public string? Title { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? BillingDayOfMonth { get; set; }
    public bool? IsActive { get; set; }
}