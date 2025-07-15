using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface ILotQuestionRepository
{
    Task<LotQuestion?> GetByIdAsync(string id);
    Task<List<LotQuestion>> GetByLotIdAsync(string lotId);
    Task<List<LotQuestion>> GetByUserIdAsync(string userId);
    Task AddAsync(LotQuestion question);
    Task UpdateAsync(LotQuestion question);
    Task DeleteAsync(string id);
}
