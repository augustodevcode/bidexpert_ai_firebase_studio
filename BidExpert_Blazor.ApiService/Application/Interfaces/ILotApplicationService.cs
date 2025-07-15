using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ServiceDefaults.Dtos;

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public interface ILotApplicationService
{
    Task<Result> ToggleFavoriteStatusAsync(string lotId, string userId);
    Task<Result<List<LotDto>>> GetFavoriteLotsForUserAsync(string userId);
    Task<Result> ProcessClosedLotAsync(string lotId); // Adicionado
    Task<Result<List<LotDto>>> GetWonLotsForUserAsync(string userId); // Adicionado
}
