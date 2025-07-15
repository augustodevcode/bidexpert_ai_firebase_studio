using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Enums;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface ILotRepository
{
    Task<Lot?> GetByIdAsync(string id);
    Task<Lot?> GetByPublicIdAsync(string publicId);
    Task<List<Lot>> GetByAuctionIdAsync(string auctionId);
    Task<List<Lot>> GetByStatusAsync(string auctionId, LotStatusDomain status);
    Task<List<Lot>> GetByCategoryIdAsync(string categoryId);
    Task<List<Lot>> GetBySubcategoryIdAsync(string subcategoryId);
    Task<List<Lot>> GetFeaturedLotsAsync(int count);
    Task<List<Lot>> GetLotsByIdsAsync(IEnumerable<string> lotIds); // Adicionado
    Task AddAsync(Lot lot);
    Task UpdateAsync(Lot lot);
    Task DeleteAsync(string id);
    Task<int> GetCountByAuctionIdAsync(string auctionId);
    Task<bool> PublicIdExistsAsync(string publicId);
}
