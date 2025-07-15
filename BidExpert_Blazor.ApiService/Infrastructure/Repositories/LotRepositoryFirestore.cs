using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Enums;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class LotRepositoryFirestore : ILotRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly CollectionReference _collection;

    public LotRepositoryFirestore(FirestoreDb firestoreDb)
    {
        _firestoreDb = firestoreDb;
        _collection = _firestoreDb.Collection("lots");
    }

    public async Task<List<Lot>> GetLotsByIdsAsync(IEnumerable<string> lotIds)
    {
        if (lotIds == null || !lotIds.Any())
        {
            return new List<Lot>();
        }
        // Firestore 'in' query is limited to 10 items. For more, multiple queries are needed.
        // This implementation assumes a small number of favorites for simplicity.
        var snapshot = await _collection.WhereIn(FieldPath.DocumentId, lotIds).GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToLot(doc)).OfType<Lot>().ToList();
    }

    public async Task UpdateAsync(Lot lot)
    {
        var docRef = _collection.Document(lot.Id);
        var data = new Dictionary<string, object?>
        {
            { "Title", lot.Title },
            { "Status", lot.Status.ToString() },
            { "Price", lot.Price },
            { "FavoriteUserIds", lot.FavoriteUserIds.ToList() }, // Persistir a lista de favoritos
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.UpdateAsync(data);
    }

    // --- Outros métodos ---
    private Lot? DocumentToLot(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;
        var data = snapshot.ToDictionary();
        var lot = new Lot(snapshot.Id, "pid", "aid", "title", "cid", 0); // Simplificação
        // Mapeamento completo aqui
        return lot;
    }
    public Task AddAsync(Lot lot) => throw new NotImplementedException();
    public Task DeleteAsync(string id) => throw new NotImplementedException();
    public Task<List<Lot>> GetByAuctionIdAsync(string auctionId) => throw new NotImplementedException();
    public Task<List<Lot>> GetByCategoryIdAsync(string categoryId) => throw new NotImplementedException();
    public Task<Lot?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<Lot?> GetByPublicIdAsync(string publicId) => throw new NotImplementedException();
    public Task<List<Lot>> GetByStatusAsync(string auctionId, LotStatusDomain status) => throw new NotImplementedException();
    public Task<List<Lot>> GetBySubcategoryIdAsync(string subcategoryId) => throw new NotImplementedException();
    public Task<int> GetCountByAuctionIdAsync(string auctionId) => throw new NotImplementedException();
    public Task<List<Lot>> GetFeaturedLotsAsync(int count) => throw new NotImplementedException();
    public Task<bool> PublicIdExistsAsync(string publicId) => throw new NotImplementedException();
}
