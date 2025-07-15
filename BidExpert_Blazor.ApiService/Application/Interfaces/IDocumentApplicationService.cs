using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.AspNetCore.Http; // Para IFormFile

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public record UploadDocumentCommand(string UserId, string DocumentTypeId, IFormFile File);

public interface IDocumentApplicationService
{
    Task<Result<List<DocumentTypeDto>>> GetRequiredDocumentTypesAsync();
    Task<Result<List<UserDocumentDto>>> GetUserDocumentsAsync(string userId);
    Task<Result<UserDocumentDto>> UploadDocumentAsync(UploadDocumentCommand command);
}
