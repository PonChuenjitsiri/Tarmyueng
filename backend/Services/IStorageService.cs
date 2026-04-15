using System.IO;
using System.Threading.Tasks;

namespace ExpenseTracker.Api.Services;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
}
