using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class UserDocumentRepositoryFirestore : IUserDocumentRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly CollectionReference _collection;

    public UserDocumentRepositoryFirestore(FirestoreDb firestoreDb)
    {
        _firestoreDb = firestoreDb;
        _collection = _firestoreDb.Collection("user_documents");
    }

    private UserDocument? DocumentToUserDoc(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;
        var data = snapshot.ToDictionary();
        var userDoc = new UserDocument(
            snapshot.Id,
            data.TryGetValue("UserId", out var uid) ? (string)uid : string.Empty,
            data.TryGetValue("DocumentTypeId", out var dtid) ? (string)dtid : string.Empty,
            data.TryGetValue("FileStoragePathOrUrl", out var url) ? (string)url : string.Empty,
            data.TryGetValue("OriginalFileName", out var fname) ? (string)fname : string.Empty
        );
        // Mapear outros campos e status
        return userDoc;
    }

    public async Task<List<UserDocument>> GetByUserIdAsync(string userId)
    {
        var snapshot = await _collection.WhereEqualTo("UserId", userId).GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToUserDoc(doc)).OfType<UserDocument>().ToList();
    }

    public async Task AddAsync(UserDocument userDocument)
    {
        var docRef = _collection.Document(userDocument.Id);
        var data = new Dictionary<string, object?>
        {
            { "UserId", userDocument.UserId },
            { "DocumentTypeId", userDocument.DocumentTypeId },
            { "FileStoragePathOrUrl", userDocument.FileStoragePathOrUrl },
            { "OriginalFileName", userDocument.OriginalFileName },
            { "Status", userDocument.Status.ToString() },
            { "UploadDate", Timestamp.FromDateTimeOffset(userDocument.UploadDate) },
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.SetAsync(data);
    }

    public async Task UpdateAsync(UserDocument userDocument)
    {
        var docRef = _collection.Document(userDocument.Id);
        var data = new Dictionary<string, object?>
        {
            { "Status", userDocument.Status.ToString() },
            { "AnalysisDate", userDocument.AnalysisDate.HasValue ? Timestamp.FromDateTimeOffset(userDocument.AnalysisDate.Value) : null },
            { "AnalystId", userDocument.AnalystId },
            { "RejectionReason", userDocument.RejectionReason },
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.UpdateAsync(data);
    }

    public Task<UserDocument?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
}
