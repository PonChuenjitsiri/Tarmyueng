using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using ZXing;
using ZXing.Common;

namespace ExpenseTracker.Api.Services;

public class SlipVerificationResult
{
    public bool IsValid { get; set; }
    public decimal VerifiedAmount { get; set; }
    public string ReceiverPromptPayId { get; set; } = string.Empty;
    public string BankTransactionRef { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}

public class SlipVerificationService
{
    private readonly ILogger<SlipVerificationService> _logger;
    private readonly EasySlipService _easySlipService;

    public SlipVerificationService(ILogger<SlipVerificationService> logger, EasySlipService easySlipService)
    {
        _logger = logger;
        _easySlipService = easySlipService;
    }

    public async Task<SlipVerificationResult> VerifySlipAsync(Stream imageStream)
    {
        _logger.LogInformation("Scanning uploaded slip image for QR code...");

        try
        {
            using var image = Image.Load<Rgba32>(imageStream);

            var reader = new ZXing.ImageSharp.BarcodeReader<Rgba32>
            {
                AutoRotate = true,
                Options = new DecodingOptions
                {
                    TryHarder = true,
                    PossibleFormats = new[] { BarcodeFormat.QR_CODE }
                }
            };

            var result = reader.Decode(image);

            if (result == null || string.IsNullOrEmpty(result.Text))
            {
                return new SlipVerificationResult { IsValid = false, ErrorMessage = "Could not detect a valid QR code in the image." };
            }

            var qrPayload = result.Text;
            _logger.LogInformation("Successfully extracted QR payload. Length: {Length}", qrPayload.Length);

            return await _easySlipService.VerifyPayloadAsync(qrPayload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing the slip image.");
            return new SlipVerificationResult { IsValid = false, ErrorMessage = "Failed to process the image file." };
        }
    }
}