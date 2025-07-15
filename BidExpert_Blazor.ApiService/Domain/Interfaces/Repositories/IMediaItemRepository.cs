using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IMediaItemRepository
{
    Task<MediaItem?> GetByIdAsync(string id);
    Task<List<MediaItem>> GetByLotIdAsync(string lotId);
    Task AddAsync(MediaItem mediaItem);
    Task UpdateAsync(MediaItem mediaItem);
    Task DeleteAsync(string id);
}
