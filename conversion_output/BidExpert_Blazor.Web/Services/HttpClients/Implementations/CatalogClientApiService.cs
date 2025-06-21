using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.AspNetCore.WebUtilities; // Para QueryHelpers

// PagedResultDto e CatalogClientQueryParameters são definidos no arquivo da interface ICatalogClientApiService.cs

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class CatalogClientApiService : ICatalogClientApiService
{
    private readonly HttpClient _httpClient;

    public CatalogClientApiService(HttpClient httpClient)
    {
        _httpClient = httpClient ?? throw new System.ArgumentNullException(nameof(httpClient));
    }

    public async Task<List<LotCategoryDto>?> GetLotCategoriesAsync()
    {
        // return await _httpClient.GetFromJsonAsync<List<LotCategoryDto>>("api/catalog/categories");
        await Task.CompletedTask; // Remover
        throw new System.NotImplementedException();
    }

    public Task<LotCategoryDto?> GetLotCategoryDetailsAsync(string categoryIdOrSlug) => throw new System.NotImplementedException();
    public Task<List<SubcategoryDto>?> GetSubcategoriesAsync(string parentCategoryIdOrSlug) => throw new System.NotImplementedException();
    public Task<SubcategoryDto?> GetSubcategoryDetailsAsync(string subcategoryId) => throw new System.NotImplementedException();
    public Task<List<StateInfoDto>?> GetStatesAsync() => throw new System.NotImplementedException();
    public Task<List<CityInfoDto>?> GetCitiesByStateAsync(string stateUfOrId) => throw new System.NotImplementedException();

    public async Task<PagedResultDto<AuctioneerProfileInfoDto>?> GetAuctioneersAsync(CatalogClientQueryParameters queryParams)
    {
        // var queryString = new Dictionary<string, string?>
        // {
        //     ["pageNumber"] = queryParams.PageNumber.ToString(),
        //     ["pageSize"] = queryParams.PageSize.ToString(),
        //     ["searchTerm"] = queryParams.SearchTerm
        // };
        // var requestUri = QueryHelpers.AddQueryString("api/catalog/auctioneers", queryString!);
        // return await _httpClient.GetFromJsonAsync<PagedResultDto<AuctioneerProfileInfoDto>>(requestUri);
        await Task.CompletedTask; // Remover
        throw new System.NotImplementedException();
    }

    public Task<AuctioneerProfileInfoDto?> GetAuctioneerDetailsAsync(string auctioneerIdOrSlug) => throw new System.NotImplementedException();

    public async Task<PagedResultDto<SellerProfileInfoDto>?> GetSellersAsync(CatalogClientQueryParameters queryParams)
    {
        // var queryString = new Dictionary<string, string?>
        // {
        //     ["pageNumber"] = queryParams.PageNumber.ToString(),
        //     ["pageSize"] = queryParams.PageSize.ToString(),
        //     ["searchTerm"] = queryParams.SearchTerm
        // };
        // var requestUri = QueryHelpers.AddQueryString("api/catalog/sellers", queryString!);
        // return await _httpClient.GetFromJsonAsync<PagedResultDto<SellerProfileInfoDto>>(requestUri);
        await Task.CompletedTask; // Remover
        throw new System.NotImplementedException();
    }

    public Task<SellerProfileInfoDto?> GetSellerDetailsAsync(string sellerIdOrSlug) => throw new System.NotImplementedException();
    public Task<List<DocumentTypeDto>?> GetDocumentTypesAsync() => throw new System.NotImplementedException();
}
