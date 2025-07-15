using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class LotQuestionRepositoryEf : ILotQuestionRepository
{
    private readonly ApplicationDbContext _dbContext;
    public LotQuestionRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(LotQuestion question) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<LotQuestion?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<List<LotQuestion>> GetByLotIdAsync(string lotId) => throw new NotImplementedException();
    public Task<List<LotQuestion>> GetByUserIdAsync(string userId) => throw new NotImplementedException();
    public Task UpdateAsync(LotQuestion question) => throw new NotImplementedException();
}
