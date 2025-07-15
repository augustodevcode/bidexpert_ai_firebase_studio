using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class AuctioneerRepositoryEf : IAuctioneerRepository
{
    private readonly ApplicationDbContext _dbContext;
    public AuctioneerRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(Auctioneer auctioneer) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<List<Auctioneer>> GetAllAsync() => throw new NotImplementedException();
    public Task<Auctioneer?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<Auctioneer?> GetByPublicIdAsync(string publicId) => throw new NotImplementedException();
    public Task<Auctioneer?> GetBySlugAsync(string slug) => throw new NotImplementedException();
    public Task UpdateAsync(Auctioneer auctioneer) => throw new NotImplementedException();
}
