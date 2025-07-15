using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ApiService.Application.Commands.Auctions;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public record AuctionQueryParameters(
    int PageNumber = 1,
    int PageSize = 10,
    string? Status = null,
    string? CategoryId = null,
    string? SearchTerm = null
);

public interface IAuctionApplicationService {
    Task<Result<AuctionDto>> GetAuctionDetailsAsync(string auctionIdOrPublicId);
    Task<PagedResult<AuctionDto>> GetAuctionsAsync(AuctionQueryParameters queryParams);
    Task<Result<AuctionDto>> CreateAuctionAsync(CreateAuctionCommand command);
    Task<Result<LotDto>> GetLotDetailsAsync(string lotIdOrPublicId);
    Task<Result<BidInfoDto>> PlaceBidAsync(PlaceBidCommand command);
    Task<Result<List<BidInfoDto>>> GetBidsForLotAsync(string lotId);
    Task<Result<List<UserBidDto>>> GetBidsByUserIdAsync(string userId); // Adicionado
}
