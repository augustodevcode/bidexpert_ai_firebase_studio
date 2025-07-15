using System.IO;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Services;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, string subfolder);
}
