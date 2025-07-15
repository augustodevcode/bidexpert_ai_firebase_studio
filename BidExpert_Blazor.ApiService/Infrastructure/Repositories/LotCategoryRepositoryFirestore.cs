using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class LotCategoryRepositoryFirestore : ILotCategoryRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly CollectionReference _collection;

    public LotCategoryRepositoryFirestore(FirestoreDb firestoreDb)
    {
        _firestoreDb = firestoreDb;
        _collection = _firestoreDb.Collection("lot_categories");
    }

    private LotCategory? DocumentToCategory(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;

        var data = snapshot.ToDictionary();

        var category = new LotCategory(
            snapshot.Id,
            data.TryGetValue("Name", out var name) ? (string)name : string.Empty,
            data.TryGetValue("Description", out var desc) ? (string)desc : null
        );

        if (data.TryGetValue("ItemCount", out var itemCount)) category.SetItemCount(Convert.ToInt32(itemCount));
        if (data.TryGetValue("HasSubcategories", out var hasSub)) category.SetHasSubcategories(Convert.ToBoolean(hasSub));

        return category;
    }

    public async Task<List<LotCategory>> GetAllAsync()
    {
        var snapshot = await _collection.OrderBy("Name").GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToCategory(doc)).OfType<LotCategory>().ToList();
    }

    public async Task<LotCategory?> GetByIdAsync(string id)
    {
        var snapshot = await _collection.Document(id).GetSnapshotAsync();
        return DocumentToCategory(snapshot);
    }

    public async Task<LotCategory?> GetBySlugAsync(string slug)
    {
        var snapshot = await _collection.WhereEqualTo("Slug", slug).Limit(1).GetSnapshotAsync();
        if (snapshot.Documents.Count == 0) return null;
        return DocumentToCategory(snapshot.Documents[0]);
    }

    public async Task<LotCategory?> GetByNameAsync(string name)
    {
        var snapshot = await _collection.WhereEqualTo("Name", name).Limit(1).GetSnapshotAsync();
        if (snapshot.Documents.Count == 0) return null;
        return DocumentToCategory(snapshot.Documents[0]);
    }

    public async Task<bool> CategoryExistsAsync(string name)
    {
        var snapshot = await _collection.WhereEqualTo("Name", name).Limit(1).GetSnapshotAsync();
        return snapshot.Documents.Count > 0;
    }

    public async Task AddAsync(LotCategory category)
    {
        var docRef = _collection.Document(category.Id);
        var data = new Dictionary<string, object?>
        {
            { "Id", category.Id },
            { "Name", category.Name },
            { "Slug", category.Slug },
            { "Description", category.Description },
            { "ItemCount", category.ItemCount },
            { "HasSubcategories", category.HasSubcategories },
            { "CreatedAt", Timestamp.FromDateTimeOffset(category.CreatedAt) },
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.SetAsync(data, SetOptions.MergeAll);
    }

    public async Task UpdateAsync(LotCategory category)
    {
        var docRef = _collection.Document(category.Id);
        var data = new Dictionary<string, object?>
        {
            { "Name", category.Name },
            { "Slug", category.Slug },
            { "Description", category.Description },
            { "ItemCount", category.ItemCount },
            { "HasSubcategories", category.HasSubcategories },
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.UpdateAsync(data.Where(kvp => kvp.Value != null).ToDictionary(kvp => kvp.Key, kvp => kvp.Value!));
    }

    public async Task DeleteAsync(string id)
    {
        await _collection.Document(id).DeleteAsync();
    }
}
