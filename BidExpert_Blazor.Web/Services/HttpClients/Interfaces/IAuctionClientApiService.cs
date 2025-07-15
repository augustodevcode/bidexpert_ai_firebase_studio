using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ServiceDefaults.Dtos;

namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public record PagedResultDto<T>(List<T> Items, int TotalCount, int PageNumber, int PageSize, int TotalPages);
public record PlaceBidRequestDto(decimal Amount);

public class AuctionClientQueryParameters
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 12;
    public string? Status { get; set; }
    public string? CategoryId { get; set; }
    public string? SearchTerm { get; set; }
}

public interface IAuctionClientApiService {
    Task<AuctionDto?> GetAuctionDetailsAsync(string auctionIdOrPublicId);
    Task<PagedResultDto<AuctionDto>?> GetAuctionsAsync(AuctionClientQueryParameters queryParams); // Renomeado
    Task<LotDto?> GetLotDetailsAsync(string lotIdOrPublicId);
    Task<BidInfoDto?> PlaceBidAsync(string lotId, PlaceBidRequestDto bidRequest);
}
