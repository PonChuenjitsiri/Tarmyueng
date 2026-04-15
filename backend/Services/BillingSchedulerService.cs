using ExpenseTracker.Api.Data;

namespace ExpenseTracker.Api.Services;

public class BillingSchedulerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BillingSchedulerService> _logger;
    private PeriodicTimer? _timer;

    public BillingSchedulerService(IServiceProvider serviceProvider, ILogger<BillingSchedulerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Billing Scheduler Service started.");

        _timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        try
        {
            while (await _timer.WaitForNextTickAsync(stoppingToken))
            {
                await TriggerBillingIfNeeded();
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Billing Scheduler Service is stopping.");
        }
        finally
        {
            _timer?.Dispose();
        }
    }

    private async Task TriggerBillingIfNeeded()
    {
        var now = DateTime.Now;  

        if (now.Hour != 0 || now.Minute != 5)
        {
            return;
        }

        try
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var billingService = scope.ServiceProvider.GetRequiredService<BillingEngineService>();
                await billingService.GenerateMonthlyBillsAsync();
                _logger.LogInformation("Daily billing check completed at {Time}", now);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in billing scheduler at {Time}", now);
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Billing Scheduler Service is stopping.");
        await base.StopAsync(cancellationToken);
    }
}
