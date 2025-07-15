using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IPlatformSettingRepository
{
    Task<PlatformSetting?> GetAsync();
    Task SaveAsync(PlatformSetting settings);
}
