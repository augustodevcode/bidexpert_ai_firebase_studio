using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class MediaItemRepositoryEf : IMediaItemRepository
{
    private readonly ApplicationDbContext _dbContext;
    public MediaItemRepositoryEf(ApplicationDbContext dbContext) { _dbContext = dbContext; }
    public Task AddAsync(MediaItem mediaItem) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<MediaItem?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<List<MediaItem>> GetByLotIdAsync(string lotId) => throw new NotImplementedException();
    public Task UpdateAsync(MediaItem mediaItem) => throw new NotImplementedException();
}
