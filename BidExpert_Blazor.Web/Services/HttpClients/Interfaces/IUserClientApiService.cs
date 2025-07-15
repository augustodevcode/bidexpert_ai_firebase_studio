using System.Threading.Tasks;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Commands.Users; // Necessário para UpdateUserProfileCommand
using Microsoft.AspNetCore.Components.Forms; // Para IBrowserFile

namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public interface IUserClientApiService {
    Task<UserProfileDataDto?> GetMyProfileAsync();
    Task<bool> UpdateMyProfileAsync(UpdateUserProfileCommand profileData);
    Task<List<UserBidDto>?> GetMyActiveBidsAsync();
    Task<List<LotDto>?> GetMyWonLotsAsync();
    Task<List<LotDto>?> GetMyFavoriteLotsAsync();
    Task<bool> ToggleFavoriteStatusAsync(string lotId);
    Task<List<UserDocumentDto>?> GetMyDocumentsAsync();
    Task<UserDocumentDto?> UploadDocumentAsync(string documentTypeId, IBrowserFile file);
    Task<List<DocumentTypeDto>?> GetDocumentTypesAsync();
}
