using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Threading.Tasks;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.AspNetCore.WebUtilities;
using System.Net.Http.Json;
using System;
using System.Collections.Generic;

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class AdminClientApiService : IAdminClientApiService
{
    private readonly HttpClient _httpClient;
    public AdminClientApiService(HttpClient httpClient) { _httpClient = httpClient; }

    public async Task<PagedResultDto<UserProfileDataDto>?> GetUsersAsync(int page, int pageSize, string? sortBy, bool sortAsc, string? searchTerm)
    {
        var queryString = new Dictionary<string, string?>
        {
            ["pageNumber"] = page.ToString(),
            ["pageSize"] = pageSize.ToString(),
            ["sortBy"] = sortBy,
            ["sortAscending"] = sortAsc.ToString(),
            ["searchTerm"] = searchTerm
        };
        var requestUri = QueryHelpers.AddQueryString("api/admin/users", queryString!);

        try
        {
            return await _httpClient.GetFromJsonAsync<PagedResultDto<UserProfileDataDto>>(requestUri);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            return null;
        }
    }
}
