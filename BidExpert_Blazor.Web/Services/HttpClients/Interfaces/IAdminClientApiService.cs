using System.Threading.Tasks;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.Web.Services.HttpClients.Implementations; // Para PagedResultDto

namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public interface IAdminClientApiService
{
    Task<PagedResultDto<UserProfileDataDto>?> GetUsersAsync(int page, int pageSize, string? sortBy, bool sortAsc, string? searchTerm);
}
