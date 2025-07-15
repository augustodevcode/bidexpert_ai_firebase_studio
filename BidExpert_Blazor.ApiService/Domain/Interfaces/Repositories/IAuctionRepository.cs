using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Enums;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

// Adicionar um record para os parâmetros de paginação/filtro
public record AuctionFilterParams(
    string? Status,
    string? CategoryId,
    string? SearchTerm,
    int PageSize,
    int PageNumber
);

public interface IAuctionRepository
{
    Task<(List<Auction> Auctions, int TotalCount)> GetPagedAuctionsAsync(AuctionFilterParams filterParams);
    Task<Auction?> GetByIdAsync(string id);
    Task<Auction?> GetByPublicIdAsync(string publicId);
    Task<List<Auction>> GetAllAsync();
    Task<List<Auction>> GetByStatusAsync(AuctionStatusDomain status);
    Task<List<Auction>> GetByAuctioneerIdAsync(string auctioneerId);
    Task<List<Auction>> GetBySellerIdAsync(string sellerId);
    Task<List<Auction>> GetByCategoryIdAsync(string categoryId);
    Task AddAsync(Auction auction);
    Task UpdateAsync(Auction auction);
    Task DeleteAsync(string id);
    Task<bool> PublicIdExistsAsync(string publicId);
}
