using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.AspNetCore.WebUtilities; // Para QueryHelpers.AddQueryString

// PagedResultDto e DTOs de Comando/Query são definidos no arquivo da interface IAuctionClientApiService.cs

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class AuctionClientApiService : IAuctionClientApiService
{
    private readonly HttpClient _httpClient;

    public AuctionClientApiService(HttpClient httpClient)
    {
        _httpClient = httpClient ?? throw new System.ArgumentNullException(nameof(httpClient));
    }

    public async Task<AuctionDto?> GetAuctionDetailsAsync(string auctionIdOrPublicId)
    {
        // try
        // {
        //     return await _httpClient.GetFromJsonAsync<AuctionDto>($"api/auctions/{auctionIdOrPublicId}");
        // }
        // catch (HttpRequestException ex) // Tratar erros de rede, status code não sucesso, etc.
        // {
        //     Console.WriteLine($"Erro ao buscar detalhes do leilão: {ex.Message}");
        //     return null;
        // }
        await Task.CompletedTask; // Remover
        throw new System.NotImplementedException();
    }

    public async Task<PagedResultDto<AuctionDto>?> GetAuctionsAsync(AuctionClientQueryParameters queryParams)
    {
        // var queryString = new Dictionary<string, string?>
        // {
        //     ["pageNumber"] = queryParams.PageNumber.ToString(),
        //     ["pageSize"] = queryParams.PageSize.ToString(),
        //     ["status"] = queryParams.Status,
        //     ["categoryId"] = queryParams.CategoryId,
        //     ["auctioneerId"] = queryParams.AuctioneerId,
        //     ["sellerId"] = queryParams.SellerId,
        //     ["searchTerm"] = queryParams.SearchTerm,
        //     ["sortBy"] = queryParams.SortBy,
        //     ["sortAscending"] = queryParams.SortAscending.ToString(),
        //     ["auctionType"] = queryParams.AuctionType
        // };
        // var requestUri = QueryHelpers.AddQueryString("api/auctions", queryString!);
        // return await _httpClient.GetFromJsonAsync<PagedResultDto<AuctionDto>>(requestUri);
        await Task.CompletedTask; // Remover
        throw new System.NotImplementedException();
    }

    public Task<AuctionDto?> CreateAuctionAsync(CreateAuctionCommand command) => throw new System.NotImplementedException();
    public Task<bool> UpdateAuctionAsync(string auctionId, UpdateAuctionCommand command) => throw new System.NotImplementedException();


    public Task<LotDto?> GetLotDetailsAsync(string lotIdOrPublicId) => throw new System.NotImplementedException();
    public Task<PagedResultDto<LotDto>?> GetLotsByAuctionAsync(string auctionIdOrPublicId, LotClientQueryParameters queryParams) => throw new System.NotImplementedException();
    public Task<PagedResultDto<LotDto>?> SearchLotsAsync(LotClientQueryParameters queryParams) => throw new System.NotImplementedException();
    public Task<LotDto?> CreateLotAsync(CreateLotCommand command) => throw new System.NotImplementedException();
    public Task<bool> UpdateLotAsync(string lotId, UpdateLotCommand command) => throw new System.NotImplementedException();

    public Task<BidInfoDto?> PlaceBidAsync(string lotId, PlaceBidRequestDto bidRequest) => throw new System.NotImplementedException();
    public Task<List<BidInfoDto>?> GetBidsForLotAsync(string lotId) => throw new System.NotImplementedException();
}
