using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TriggerBillingController : ControllerBase
{
    private readonly BillingEngineService _billingService;

    public TriggerBillingController(BillingEngineService billingService)
    {
        _billingService = billingService;
    }

    [HttpPost("manual")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RunBillingEngine()
    {
        await _billingService.GenerateMonthlyBillsAsync();
        return Ok(new { message = "Billing engine executed." });
    }
}