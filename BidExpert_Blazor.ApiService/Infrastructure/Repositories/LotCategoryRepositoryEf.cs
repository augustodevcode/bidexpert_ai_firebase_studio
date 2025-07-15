using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class LotCategoryRepositoryEf : ILotCategoryRepository
{
    private readonly ApplicationDbContext _dbContext;
    public LotCategoryRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(LotCategory category) => throw new NotImplementedException();
    public Task<bool> CategoryExistsAsync(string name) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<List<LotCategory>> GetAllAsync() => throw new NotImplementedException();
    public Task<LotCategory?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<LotCategory?> GetByNameAsync(string name) => throw new NotImplementedException();
    public Task<LotCategory?> GetBySlugAsync(string slug) => throw new NotImplementedException();
    public Task UpdateAsync(LotCategory category) => throw new NotImplementedException();
}
