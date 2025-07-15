using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IStateInfoRepository
{
    Task<StateInfo?> GetByIdAsync(string id);
    Task<StateInfo?> GetByUfAsync(string uf);
    Task<StateInfo?> GetBySlugAsync(string slug);
    Task<List<StateInfo>> GetAllAsync();
    Task AddAsync(StateInfo state);
    Task UpdateAsync(StateInfo state);
    Task DeleteAsync(string id);
    Task<bool> StateExistsByUfAsync(string uf);
}
