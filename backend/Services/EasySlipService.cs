using RestSharp;
using System.Text.Json.Nodes;

namespace ExpenseTracker.Api.Services;

public class EasySlipService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EasySlipService> _logger;

    public EasySlipService(IConfiguration config, ILogger<EasySlipService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<SlipVerificationResult> VerifyPayloadAsync(string payload)
    {
        var apiKey = _config["EasySlip:ApiKey"] ?? Environment.GetEnvironmentVariable("EASYSLIP_API_KEY");
        
        if (string.IsNullOrEmpty(apiKey) || apiKey == "59262e7d-f08d-4951-a4ff-88a90fa1c0f5")
        {
            _logger.LogWarning("EasySlip API Key is missing or mock. Bypassing external check and returning mock success.");
            return new SlipVerificationResult 
            {
                IsValid = true,
                VerifiedAmount = 50.00m,
                ReceiverPromptPayId = "ADMIN_MOCK",
                BankTransactionRef = "EASYSLIP_" + Guid.NewGuid().ToString().Substring(0, 8)
            };
        }

        _logger.LogInformation("Calling EasySlip V2 API...");
        
        var client = new RestClient("https://api.easyslip.com/v2/verify/bank");
        var request = new RestRequest("", Method.Post);
        
        request.AddHeader("Authorization", $"Bearer {apiKey}");
        request.AddHeader("Content-Type", "application/json");
        request.AddJsonBody(new { payload = payload });

        var response = await client.ExecuteAsync(request);
        
        if (!response.IsSuccessful || string.IsNullOrEmpty(response.Content))
        {
            _logger.LogError("EasySlip API network failure or bad request: {Content}", response.Content);
            return new SlipVerificationResult { IsValid = false, ErrorMessage = "Failed to communicate with the verification server." };
        }

        try
        {
            var json = JsonNode.Parse(response.Content);
            
            var isSuccess = json?["success"]?.GetValue<bool>() ?? false;
            
            if (!isSuccess)
            {
                var message = json?["message"]?.GetValue<string>() ?? "Slip rejected by bank.";
                _logger.LogWarning("EasySlip returned invalid status: {Message}", message);
                return new SlipVerificationResult { IsValid = false, ErrorMessage = message };
            }

            var data = json?["data"];
            if (data == null)
            {
                return new SlipVerificationResult { IsValid = false, ErrorMessage = "Missing data payload from EasySlip." };
            }

            decimal amount = data["amountInSlip"]?.GetValue<decimal>() ?? 0m;

            var transRef = data["rawSlip"]?["transRef"]?.GetValue<string>() ?? Guid.NewGuid().ToString();

            return new SlipVerificationResult
            {
                IsValid = true,
                VerifiedAmount = amount,
                BankTransactionRef = transRef,
                ReceiverPromptPayId = "ADMIN_MOCK" 
            };
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "Failed to parse EasySlip response JSON: {Content}", response.Content);
            return new SlipVerificationResult { IsValid = false, ErrorMessage = "Failed to parse bank API response." };
        }
    }
}
