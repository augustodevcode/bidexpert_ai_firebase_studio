using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface ICityInfoRepository
{
    Task<CityInfo?> GetByIdAsync(string id);
    Task<List<CityInfo>> GetByStateIdAsync(string stateId);
    Task<CityInfo?> GetBySlugAsync(string slug, string stateId);
    Task AddAsync(CityInfo city);
    Task UpdateAsync(CityInfo city);
    Task DeleteAsync(string id);
}
