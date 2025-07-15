using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class CityInfoRepositoryEf : ICityInfoRepository
{
    private readonly ApplicationDbContext _dbContext;
    public CityInfoRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(CityInfo city) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<CityInfo?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<List<CityInfo>> GetByStateIdAsync(string stateId) => throw new NotImplementedException();
    public Task<CityInfo?> GetBySlugAsync(string slug, string stateId) => throw new NotImplementedException();
    public Task UpdateAsync(CityInfo city) => throw new NotImplementedException();
}
