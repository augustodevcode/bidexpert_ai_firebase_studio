using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class ReviewRepositoryEf : IReviewRepository
{
    private readonly ApplicationDbContext _dbContext;
    public ReviewRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(Review review) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<Review?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<List<Review>> GetByLotIdAsync(string lotId) => throw new NotImplementedException();
    public Task<List<Review>> GetByUserIdAsync(string userId) => throw new NotImplementedException();
    public Task UpdateAsync(Review review) => throw new NotImplementedException();
}
