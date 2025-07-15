using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface ILotCategoryRepository
{
    Task<LotCategory?> GetByIdAsync(string id);
    Task<LotCategory?> GetBySlugAsync(string slug);
    Task<LotCategory?> GetByNameAsync(string name);
    Task<List<LotCategory>> GetAllAsync();
    Task AddAsync(LotCategory category);
    Task UpdateAsync(LotCategory category);
    Task DeleteAsync(string id);
    Task<bool> CategoryExistsAsync(string name);
}
