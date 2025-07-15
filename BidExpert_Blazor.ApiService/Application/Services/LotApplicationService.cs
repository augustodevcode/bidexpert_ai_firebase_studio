using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ServiceDefaults.Dtos;

namespace BidExpert_Blazor.ApiService.Application.Services;

public class LotApplicationService : ILotApplicationService
{
    private readonly ILotRepository _lotRepository;
    private readonly IBidRepository _bidRepository;

    public LotApplicationService(ILotRepository lotRepository, IBidRepository bidRepository)
    {
        _lotRepository = lotRepository;
        _bidRepository = bidRepository;
    }

    public async Task<Result> ProcessClosedLotAsync(string lotId)
    {
        try
        {
            var lot = await _lotRepository.GetByIdAsync(lotId);
            if (lot == null) return Result.Failure("Lot not found.");

            var highestBid = await _bidRepository.GetHighestBidForLotAsync(lotId);
            if (highestBid != null)
            {
                lot.CloseAsSold(highestBid.UserId, highestBid.Amount);
            }
            else
            {
                lot.CloseAsNotSold();
            }

            await _lotRepository.UpdateAsync(lot);
            return Result.Success("Lot closure processed.");
        }
        catch (Exception ex)
        {
            return Result.Failure($"Error processing lot closure: {ex.Message}");
        }
    }

    public async Task<Result<List<LotDto>>> GetWonLotsForUserAsync(string userId)
    {
        try
        {
            // Esta query precisaria ser implementada no repositório.
            // var lots = await _lotRepository.GetLotsWonByUserIdAsync(userId);
            // Por simplicidade, vou simular o resultado aqui.
            var lots = new List<Domain.Entities.Lot>(); // Simulação
            var lotDtos = lots.Select(lot => new LotDto { /* Mapear */ }).ToList();
            return Result<List<LotDto>>.Success(lotDtos);
        }
        catch (Exception ex)
        {
            return Result<List<LotDto>>.Failure($"Error fetching won lots: {ex.Message}");
        }
    }

    public Task<Result> ToggleFavoriteStatusAsync(string lotId, string userId) => throw new NotImplementedException();
    public Task<Result<List<LotDto>>> GetFavoriteLotsForUserAsync(string userId) => throw new NotImplementedException();
}
