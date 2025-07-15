using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Services;
using BidExpert_Blazor.ServiceDefaults.Dtos;

namespace BidExpert_Blazor.ApiService.Application.Services;

public class DocumentApplicationService : IDocumentApplicationService
{
    private readonly IDocumentTypeRepository _docTypeRepo;
    private readonly IUserDocumentRepository _userDocRepo;
    private readonly IFileStorageService _fileStorage;

    public DocumentApplicationService(IDocumentTypeRepository docTypeRepo, IUserDocumentRepository userDocRepo, IFileStorageService fileStorage)
    {
        _docTypeRepo = docTypeRepo;
        _userDocRepo = userDocRepo;
        _fileStorage = fileStorage;
    }

    public async Task<Result<List<DocumentTypeDto>>> GetRequiredDocumentTypesAsync()
    {
        var docTypes = await _docTypeRepo.GetAllAsync();
        var dtos = docTypes.Select(d => new DocumentTypeDto { /* Mapear */ Id = d.Id, Name = d.Name, Description = d.Description, IsRequired = d.IsRequired }).ToList();
        return Result<List<DocumentTypeDto>>.Success(dtos);
    }

    public async Task<Result<List<UserDocumentDto>>> GetUserDocumentsAsync(string userId)
    {
        var userDocs = await _userDocRepo.GetByUserIdAsync(userId);
        var dtos = userDocs.Select(d => new UserDocumentDto { /* Mapear */ Id = d.Id, DocumentTypeId = d.DocumentTypeId, FileUrl = d.FileStoragePathOrUrl, Status = (ServiceDefaults.Dtos.Enums.UserDocumentStatus)d.Status }).ToList();
        return Result<List<UserDocumentDto>>.Success(dtos);
    }

    public async Task<Result<UserDocumentDto>> UploadDocumentAsync(UploadDocumentCommand command)
    {
        try
        {
            await using var stream = command.File.OpenReadStream();
            var fileUrl = await _fileStorage.SaveFileAsync(stream, command.File.FileName, command.File.ContentType, $"docs/{command.UserId}");

            var userDoc = new UserDocument(
                Guid.NewGuid().ToString(),
                command.UserId,
                command.DocumentTypeId,
                fileUrl,
                command.File.FileName
            );

            await _userDocRepo.AddAsync(userDoc);
            var dto = new UserDocumentDto { Id = userDoc.Id, FileUrl = userDoc.FileStoragePathOrUrl };
            return Result<UserDocumentDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<UserDocumentDto>.Failure($"Upload failed: {ex.Message}");
        }
    }
}
