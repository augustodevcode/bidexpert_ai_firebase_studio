using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using BidExpert_Blazor.ApiService.Application.Commands.Auctions;

namespace BidExpert_Blazor.ApiService.Application.Services;

public class AuctionApplicationService : IAuctionApplicationService
{
    private readonly IAuctionRepository _auctionRepository;
    private readonly ILotRepository _lotRepository;
    private readonly IBidRepository _bidRepository;

    public AuctionApplicationService(IAuctionRepository auctionRepository, ILotRepository lotRepository, IBidRepository bidRepository)
    {
        _auctionRepository = auctionRepository; _lotRepository = lotRepository; _bidRepository = bidRepository;
    }

    public async Task<Result<List<UserBidDto>>> GetBidsByUserIdAsync(string userId)
    {
        try
        {
            var bids = await _bidRepository.GetBidsByUserIdAsync(userId);
            var lotIds = bids.Select(b => b.LotId).Distinct().ToList();
            var lots = new List<Lot>(); // Em um caso real, buscaria todos os lotes de uma vez.
            foreach(var id in lotIds)
            {
                var lot = await _lotRepository.GetByIdAsync(id);
                if(lot != null) lots.Add(lot);
            }

            var userBidsDto = new List<UserBidDto>();
            foreach(var bid in bids)
            {
                var lot = lots.FirstOrDefault(l => l.Id == bid.LotId);
                if(lot != null)
                {
                    var bidStatus = lot.Price == bid.Amount ? ServiceDefaults.Dtos.Enums.UserBidStatus.GANHANDO : ServiceDefaults.Dtos.Enums.UserBidStatus.PERDENDO;
                    userBidsDto.Add(new UserBidDto {
                        Id = bid.Id,
                        LotId = lot.Id,
                        AuctionId = lot.AuctionId,
                        LotTitle = lot.Title,
                        LotImageUrl = "placeholder.jpg", // A entidade Lot não tem ImageUrl ainda
                        UserBidAmount = bid.Amount,
                        CurrentLotPrice = lot.Price,
                        BidStatus = bidStatus,
                        BidDate = bid.Timestamp,
                        LotEndDate = lot.EndDate
                    });
                }
            }
            return Result<List<UserBidDto>>.Success(userBidsDto);
        }
        catch (Exception ex)
        {
            return Result<List<UserBidDto>>.Failure($"Error fetching user bids: {ex.Message}");
        }
    }

    // --- Outros Métodos (simplificados para brevidade) ---
    public Task<PagedResult<AuctionDto>> GetAuctionsAsync(AuctionQueryParameters queryParams) => throw new NotImplementedException();
    public Task<Result<AuctionDto>> GetAuctionDetailsAsync(string auctionIdOrPublicId) => throw new NotImplementedException();
    public Task<Result<AuctionDto>> CreateAuctionAsync(CreateAuctionCommand command) => throw new NotImplementedException();
    public Task<Result<LotDto>> GetLotDetailsAsync(string lotIdOrPublicId) => throw new NotImplementedException();
    public Task<Result<BidInfoDto>> PlaceBidAsync(PlaceBidCommand command) => throw new NotImplementedException();
    public Task<Result<List<BidInfoDto>>> GetBidsForLotAsync(string lotId) => throw new NotImplementedException();
}
