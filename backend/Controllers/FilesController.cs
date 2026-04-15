using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Api.Services;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly MinioService _minioService;
    private readonly long _maxFileSize = 10 * 1024 * 1024; 
    private readonly string[] _allowedContentTypes = { "image/jpeg", "image/png", "image/gif", "application/pdf" };

    public FilesController(MinioService minioService)
    {
        _minioService = minioService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file provided." });
        }

        if (file.Length > _maxFileSize)
        {
            return BadRequest(new { error = "File size exceeds maximum allowed size (10 MB)." });
        }

        if (!_allowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { error = "File type not allowed." });
        }

        try
        {
            string fileExtension = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(fileExtension)) fileExtension = ".jpg";
            string uniqueFileName = $"TEST_{Guid.NewGuid()}{fileExtension}";

            using var stream = file.OpenReadStream();

            string url = await _minioService.UploadFileAsync(stream, uniqueFileName, file.ContentType);

            return Ok(new
            {
                message = "File uploaded successfully to Minio!",
                originalName = file.FileName,
                fileName = uniqueFileName,
                url = url
            });
        }
        catch
        {
            return StatusCode(500, new { error = "File upload failed." });
        }
    }
}