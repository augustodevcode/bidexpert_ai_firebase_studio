using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IAuctioneerRepository
{
    Task<Auctioneer?> GetByIdAsync(string id);
    Task<Auctioneer?> GetByPublicIdAsync(string publicId);
    Task<Auctioneer?> GetBySlugAsync(string slug);
    Task<List<Auctioneer>> GetAllAsync();
    Task AddAsync(Auctioneer auctioneer);
    Task UpdateAsync(Auctioneer auctioneer);
    Task DeleteAsync(string id);
}
