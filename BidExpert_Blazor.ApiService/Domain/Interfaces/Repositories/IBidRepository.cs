using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IBidRepository
{
    Task<Bid?> GetByIdAsync(string id);
    Task<List<Bid>> GetBidsByLotIdAsync(string lotId);
    Task<List<Bid>> GetBidsByUserIdAsync(string userId);
    Task<Bid?> GetHighestBidForLotAsync(string lotId); // Adicionado
    Task AddAsync(Bid bid);
}
