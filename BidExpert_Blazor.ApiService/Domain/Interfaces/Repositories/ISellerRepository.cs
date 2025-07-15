using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface ISellerRepository
{
    Task<Seller?> GetByIdAsync(string id);
    Task<Seller?> GetByPublicIdAsync(string publicId);
    Task<Seller?> GetBySlugAsync(string slug);
    Task<List<Seller>> GetAllAsync();
    Task AddAsync(Seller seller);
    Task UpdateAsync(Seller seller);
    Task DeleteAsync(string id);
}
