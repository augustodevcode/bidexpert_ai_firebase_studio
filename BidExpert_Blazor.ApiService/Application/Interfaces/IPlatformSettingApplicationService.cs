using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ApiService.Application.Commands.Platform;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public interface IPlatformSettingApplicationService {
    Task<Result<PlatformSettingsDto?>> GetCurrentPlatformSettingsAsync();
    Task<Result> UpdatePlatformSettingsAsync(UpdatePlatformSettingsCommand command);
}
