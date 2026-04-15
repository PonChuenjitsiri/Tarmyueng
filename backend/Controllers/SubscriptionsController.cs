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
}