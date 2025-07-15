using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class StateInfoRepositoryEf : IStateInfoRepository
{
    private readonly ApplicationDbContext _dbContext;
    public StateInfoRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(StateInfo state) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<List<StateInfo>> GetAllAsync() => throw new NotImplementedException();
    public Task<StateInfo?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<StateInfo?> GetBySlugAsync(string slug) => throw new NotImplementedException();
    public Task<StateInfo?> GetByUfAsync(string uf) => throw new NotImplementedException();
    public Task<bool> StateExistsByUfAsync(string uf) => throw new NotImplementedException();
    public Task UpdateAsync(StateInfo state) => throw new NotImplementedException();
}
