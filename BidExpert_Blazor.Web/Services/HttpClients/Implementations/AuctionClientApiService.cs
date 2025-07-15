using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.AspNetCore.WebUtilities;

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class AuctionClientApiService : IAuctionClientApiService
{
    private readonly HttpClient _httpClient;

    public AuctionClientApiService(HttpClient httpClient) { _httpClient = httpClient; }

    public async Task<PagedResultDto<AuctionDto>?> GetAuctionsAsync(AuctionClientQueryParameters queryParams)
    {
        var queryString = new Dictionary<string, string?>
        {
            ["pageNumber"] = queryParams.PageNumber.ToString(),
            ["pageSize"] = queryParams.PageSize.ToString(),
            ["status"] = queryParams.Status,
            ["categoryId"] = queryParams.CategoryId,
            ["searchTerm"] = queryParams.SearchTerm,
        };
        var requestUri = QueryHelpers.AddQueryString("api/auctions", queryString!);

        try
        {
            return await _httpClient.GetFromJsonAsync<PagedResultDto<AuctionDto>>(requestUri);
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Error fetching auctions: {ex.Message}");
            return null;
        }
    }

    public Task<AuctionDto?> GetAuctionDetailsAsync(string auctionIdOrPublicId) => throw new System.NotImplementedException();
    public Task<LotDto?> GetLotDetailsAsync(string lotIdOrPublicId) => throw new System.NotImplementedException();
    public Task<BidInfoDto?> PlaceBidAsync(string lotId, PlaceBidRequestDto bidRequest) => throw new System.NotImplementedException();
}
