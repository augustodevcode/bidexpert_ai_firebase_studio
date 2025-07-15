using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class SellerRepositoryEf : ISellerRepository
{
    private readonly ApplicationDbContext _dbContext;
    public SellerRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(Seller seller) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<List<Seller>> GetAllAsync() => throw new NotImplementedException();
    public Task<Seller?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<Seller?> GetByPublicIdAsync(string publicId) => throw new NotImplementedException();
    public Task<Seller?> GetBySlugAsync(string slug) => throw new NotImplementedException();
    public Task UpdateAsync(Seller seller) => throw new NotImplementedException();
}
