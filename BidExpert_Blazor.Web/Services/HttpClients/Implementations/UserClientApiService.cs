using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using System;
using BidExpert_Blazor.ApiService.Application.Commands.Users;
using Microsoft.AspNetCore.Components.Forms;

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class UserClientApiService : IUserClientApiService
{
    private readonly HttpClient _httpClient;
    public UserClientApiService(HttpClient httpClient) { _httpClient = httpClient; }

    public async Task<UserDocumentDto?> UploadDocumentAsync(string documentTypeId, IBrowserFile file)
    {
        try
        {
            using var content = new MultipartFormDataContent();
            using var fileStream = file.OpenReadStream(maxAllowedSize: 1024 * 1024 * 10); // 10 MB limit
            content.Add(new StreamContent(fileStream), "file", file.Name);
            content.Add(new StringContent(documentTypeId), "documentTypeId");

            var response = await _httpClient.PostAsync("api/users/me/documents", content);
            if(response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<UserDocumentDto>();
            }
            return null;
        }
        catch (Exception ex) { Console.WriteLine(ex.Message); return null; }
    }

    public async Task<List<DocumentTypeDto>?> GetDocumentTypesAsync()
    {
        // Este endpoint precisaria ser criado
        // try { return await _httpClient.GetFromJsonAsync<List<DocumentTypeDto>>("api/catalog/document-types"); }
        // catch (Exception ex) { Console.WriteLine(ex.Message); return null; }
        await Task.CompletedTask;
        return new List<DocumentTypeDto> { new DocumentTypeDto { Id = "doc1", Name = "RG/CNH", IsRequired = true } }; // Mock
    }

    // --- Métodos existentes ---
    public Task<UserProfileDataDto?> GetMyProfileAsync() => throw new NotImplementedException();
    public Task<bool> UpdateMyProfileAsync(UpdateUserProfileCommand profileData) => throw new NotImplementedException();
    public Task<List<UserBidDto>?> GetMyActiveBidsAsync() => throw new NotImplementedException();
    public Task<List<LotDto>?> GetMyWonLotsAsync() => throw new NotImplementedException();
    public Task<List<LotDto>?> GetMyFavoriteLotsAsync() => throw new NotImplementedException();
    public Task<bool> ToggleFavoriteStatusAsync(string lotId) => throw new NotImplementedException();
    public Task<List<UserDocumentDto>?> GetMyDocumentsAsync() => throw new NotImplementedException();
}
