using System;
using BidExpert_Blazor.ApiService.Domain.Enums;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class UserDocument {
    public string Id { get; private set; }
    public string UserId { get; private set; }
    public string DocumentTypeId { get; private set; }
    public string FileStoragePathOrUrl { get; private set; }
    public string OriginalFileName { get; private set; }
    public UserDocumentStatusDomain Status { get; private set; }
    public DateTimeOffset UploadDate { get; private set; }
    public DateTimeOffset? AnalysisDate { get; private set; }
    public string? AnalystId { get; private set; }
    public string? RejectionReason { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }


    public UserDocument(string id, string userId, string documentTypeId, string fileStoragePathOrUrl, string originalFileName) {
        Id = id; UserId = userId; DocumentTypeId = documentTypeId; FileStoragePathOrUrl = fileStoragePathOrUrl; OriginalFileName = originalFileName;
        Status = UserDocumentStatusDomain.Submitted; UploadDate = DateTimeOffset.UtcNow;
        CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void Approve(string analystId) { Status = UserDocumentStatusDomain.Approved; AnalysisDate = DateTimeOffset.UtcNow; AnalystId = analystId; RejectionReason = null; UpdatedAt = DateTimeOffset.UtcNow; }
    public void Reject(string analystId, string reason) { Status = UserDocumentStatusDomain.Rejected; AnalysisDate = DateTimeOffset.UtcNow; AnalystId = analystId; RejectionReason = reason; UpdatedAt = DateTimeOffset.UtcNow; }
    public void SetToPendingAnalysis() { Status = UserDocumentStatusDomain.PendingAnalysis; AnalysisDate = DateTimeOffset.UtcNow; AnalystId = null; RejectionReason = null; UpdatedAt = DateTimeOffset.UtcNow; }
}
