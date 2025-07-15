using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(string id);
    Task<List<Review>> GetByLotIdAsync(string lotId);
    Task<List<Review>> GetByUserIdAsync(string userId);
    Task AddAsync(Review review);
    Task UpdateAsync(Review review);
    Task DeleteAsync(string id);
}
