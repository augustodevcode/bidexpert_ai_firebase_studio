using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class DocumentTypeRepositoryFirestore : IDocumentTypeRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly CollectionReference _collection;

    public DocumentTypeRepositoryFirestore(FirestoreDb firestoreDb)
    {
        _firestoreDb = firestoreDb;
        _collection = _firestoreDb.Collection("document_types");
    }

    private DocumentType? DocumentToDocType(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;
        var data = snapshot.ToDictionary();
        return new DocumentType(
            snapshot.Id,
            data.TryGetValue("Name", out var name) ? (string)name : string.Empty,
            data.TryGetValue("IsRequired", out var req) ? Convert.ToBoolean(req) : false,
            data.TryGetValue("AllowedFormats", out var af) && af is List<object> afl ? afl.Cast<string>().ToList() : new List<string>(),
            data.TryGetValue("DisplayOrder", out var order) ? Convert.ToInt32(order) : 0,
            data.TryGetValue("Description", out var desc) ? (string)desc : null
        );
    }

    public async Task<List<DocumentType>> GetAllAsync()
    {
        var snapshot = await _collection.OrderBy("DisplayOrder").GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToDocType(doc)).OfType<DocumentType>().ToList();
    }

    public Task AddAsync(DocumentType documentType) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<DocumentType?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task UpdateAsync(DocumentType documentType) => throw new NotImplementedException();
}
