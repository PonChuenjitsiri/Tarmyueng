using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using ZXing;
using ZXing.Common;
using System.Text.Json;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly MinioService _minioService;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        AppDbContext context,
        MinioService minioService,
        IConfiguration config,
        ILogger<PaymentsController> logger)
    {
        _context = context;
        _minioService = minioService;
        _config = config;
        _logger = logger;
    }

    [HttpPost("upload-slip/{billShareId}")]
    [RequestSizeLimit(10485760)] 
    [RequestFormLimits(MultipartBodyLengthLimit = 10485760)]
    public async Task<IActionResult> UploadSlip(int billShareId, IFormFile file)
    {
        _logger.LogInformation("--- STARTING PAYMENT UPLOAD ---");

        if (file == null || file.Length == 0) return BadRequest(new { error = "File is missing." });

        _logger.LogInformation($"[1/7] Fetching bill details from DB for ID: {billShareId}");
        var billShare = await _context.BillShares
            .Include(bs => bs.MonthlyBill)
            .FirstOrDefaultAsync(bs => bs.Id == billShareId);

        if (billShare == null) return NotFound(new { error = "Bill not found." });
        if (billShare.Status == "Paid") return BadRequest(new { error = "Bill is already paid." });

        _logger.LogInformation("[2/7] Copying uploaded file to memory stream");
        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        memoryStream.Position = 0;

        string qrPayload = "";
        try
        {
            _logger.LogInformation("[3/7] Loading ImageSharp for QR Code extraction");
            using var image = Image.Load<Rgba32>(memoryStream);
            
            _logger.LogInformation("[4/7] Decoding QR Code with ZXing");
            var reader = new ZXing.ImageSharp.BarcodeReader<Rgba32>
            {
                AutoRotate = true,
                Options = new DecodingOptions { TryHarder = true, PossibleFormats = new[] { BarcodeFormat.QR_CODE } }
            };
            var result = reader.Decode(image);
            if (result != null) qrPayload = result.Text;

            if (string.IsNullOrEmpty(qrPayload)) {
                _logger.LogWarning("--- NO QR CODE FOUND IN IMAGE ---");
                return BadRequest(new { error = "No QR Code found in image." });
            }
            _logger.LogInformation($"[5/7] QR Code Extracted successfully (Length: {qrPayload.Length})");
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ERROR] Failed during image processing: {ex.Message}");
            return StatusCode(500, new { error = "Image Processing Error" });
        }

        var apiKey = _config["EasySlip:ApiKey"] ?? Environment.GetEnvironmentVariable("EASYSLIP_API_KEY");
        if (string.IsNullOrEmpty(apiKey)) return BadRequest(new { error = "EasySlip API Key is missing from configuration." });

        decimal verifiedAmount = 0;
        string transRef = "";

        _logger.LogInformation("[6/7] Sending QR payload to EasySlip API for verification");
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(15);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        
        var content = new StringContent(JsonSerializer.Serialize(new { payload = qrPayload }), System.Text.Encoding.UTF8, "application/json");

        try 
        {
            var response = await client.PostAsync("https://api.easyslip.com/v2/verify/bank", content);
            var responseString = await response.Content.ReadAsStringAsync();
            
            _logger.LogInformation($"--- EASYSLIP RESPONSE RECEIVED --- Status: {response.StatusCode}");
            var json = JsonDocument.Parse(responseString);
            var root = json.RootElement;
            
            bool isSuccess = root.TryGetProperty("success", out var successProp) && successProp.GetBoolean();
            if (!isSuccess) 
            {
                var msg = root.TryGetProperty("message", out var msgProp) ? msgProp.GetString() : "Unknown bank rejection.";
                _logger.LogWarning($"[EasySlip Rejection] {msg}");
                return BadRequest(new { error = "Bank rejected slip.", details = msg });
            }

            var data = root.GetProperty("data");
            verifiedAmount = data.GetProperty("amountInSlip").GetDecimal();
            transRef = data.GetProperty("rawSlip").GetProperty("transRef").GetString() ?? Guid.NewGuid().ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ERROR] EasySlip Verification Failed: {ex.Message}");
            return StatusCode(500, new { error = "Payment verification failed" });
        }

        if (verifiedAmount < billShare.AmountOwed)
        {
            _logger.LogWarning($"[Validation] Insufficient amount. Required: {billShare.AmountOwed}, Paid: {verifiedAmount}");
            return BadRequest(new { error = "Insufficient payment amount.", required = billShare.AmountOwed, verified = verifiedAmount });
        }

        _logger.LogInformation("[7/7] Uploading verified slip image to MinIO Storage");
        byte[] fileBytes = memoryStream.ToArray(); 
        string fileExtension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(fileExtension)) fileExtension = ".jpg";
        string uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        if (string.IsNullOrEmpty(fileExtension)) fileExtension = ".jpg"; 

        using var stream = file.OpenReadStream();

        string minioUrl = "";
        try 
        {
            minioUrl = await _minioService.UploadFileAsync(stream, uniqueFileName, file.ContentType);
            _logger.LogInformation($"--- MINIO UPLOAD SUCCESSFUL: {minioUrl} ---");
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ERROR] MinIO Upload Failed: {ex.Message}");
            return StatusCode(500, new { error = "Storage upload failed" });
        }

        var payment = new Payment
        {
            BillShareId = billShare.Id,
            ReceiptImageUrl = minioUrl,
            BankTransactionRef = transRef,
            VerifiedAmount = verifiedAmount,
            Status = "Approved",
            VerifiedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        billShare.Status = "Paid";

        try
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("--- PROCESS COMPLETE ---");
            return Ok(new { message = "Payment verified and approved successfully!", payment });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError($"[ERROR] Duplicate slip detected in DB: {ex.Message}");
            return BadRequest(new { error = "This slip has already been used." });
        }
    }
}