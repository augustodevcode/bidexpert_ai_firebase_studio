using System;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record UserDocumentDto
{
    public string Id { get; init; } = string.Empty;
    public string DocumentTypeId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string? FileUrl { get; init; }
    public UserDocumentStatus Status { get; init; }
    public DateTimeOffset? UploadDate { get; init; }
    public DateTimeOffset? AnalysisDate { get; init; }
    public string? AnalystId { get; init; }
    public string? RejectionReason { get; init; }
    public DocumentTypeDto DocumentType { get; init; } = new DocumentTypeDto(); // Assuming DocumentType will always be present
}
