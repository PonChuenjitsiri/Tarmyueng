using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using ZXing;
using ZXing.Common;
using RestSharp;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class VerifyDebugController : ControllerBase
{
    private readonly SlipVerificationService _slipService;
    private readonly IConfiguration _config;

    public VerifyDebugController(SlipVerificationService slipService, IConfiguration config)
    {
        _slipService = slipService;
        _config = config;
    }

    [HttpPost("test-easyslip")]
    public async Task<IActionResult> TestEasySlip(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Please upload an image file.");
        }

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            using var image = Image.Load<Rgba32>(ms);

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
                return BadRequest(new { error = "No QR code found in the uploaded image." });
            }

            var payload = result.Text;

            var apiKey = _config["EasySlip:ApiKey"] ?? Environment.GetEnvironmentVariable("EASYSLIP_API_KEY");

            var client = new RestClient("https://api.easyslip.com/v2/verify/bank");
            var request = new RestRequest("", Method.Post);

            request.AddHeader("Authorization", $"Bearer {apiKey}");
            request.AddHeader("Content-Type", "application/json");
            request.AddJsonBody(new { payload = payload });

            var response = await client.ExecuteAsync(request);

            if (!response.IsSuccessful || string.IsNullOrEmpty(response.Content))
            {
                return StatusCode((int)response.StatusCode, new
                {
                    error = "EasySlip API verification failed.",
                    easyslip_response = response.Content
                });
            }

            var easySlipJson = System.Text.Json.JsonDocument.Parse(response.Content);

            return Ok(new
            {
                success = true,
                message = "QR Code successfully verified!",
                payload = easySlipJson
            });

        }
        catch
        {
            return StatusCode(500, new { error = "An error occurred during verification." });
        }
    }

    [HttpPost("test-qr-only")]
    public async Task<IActionResult> TestQrOnly(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Please upload an image file.");
        }

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            using var image = Image.Load<Rgba32>(ms);

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
                return Ok(new { success = false, message = "Could not detect any QR code in the image." });
            }

            return Ok(new
            {
                success = true,
                message = "QR Code successfully read from image!",
                payload = result.Text
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}