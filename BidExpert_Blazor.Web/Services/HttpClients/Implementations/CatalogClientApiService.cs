using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Threading.Tasks;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos;

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class CatalogClientApiService : ICatalogClientApiService
{
    private readonly HttpClient _httpClient;
    public CatalogClientApiService(HttpClient httpClient) { _httpClient = httpClient; }
    public Task<List<LotCategoryDto>?> GetLotCategoriesAsync() => throw new System.NotImplementedException();
    public Task<List<SubcategoryDto>?> GetSubcategoriesAsync(string parentCategoryId) => throw new System.NotImplementedException();
}
