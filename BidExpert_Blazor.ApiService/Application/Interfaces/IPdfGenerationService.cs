using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public interface IPdfGenerationService
{
    Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent);
}
