using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class PlatformSettingRepositoryEf : IPlatformSettingRepository
{
    private readonly ApplicationDbContext _dbContext;
    public PlatformSettingRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task<PlatformSetting?> GetAsync() => throw new NotImplementedException();
    public Task SaveAsync(PlatformSetting settings) => throw new NotImplementedException();
}
