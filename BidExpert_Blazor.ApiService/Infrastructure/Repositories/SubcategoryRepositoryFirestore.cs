using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class SubcategoryRepositoryEf : ISubcategoryRepository
{
    private readonly ApplicationDbContext _dbContext;
    public SubcategoryRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(Subcategory subcategory) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<Subcategory?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<List<Subcategory>> GetByParentCategoryIdAsync(string parentCategoryId) => throw new NotImplementedException();
    public Task<Subcategory?> GetBySlugAsync(string slug, string parentCategoryId) => throw new NotImplementedException();
    public Task UpdateAsync(Subcategory subcategory) => throw new NotImplementedException();
}
