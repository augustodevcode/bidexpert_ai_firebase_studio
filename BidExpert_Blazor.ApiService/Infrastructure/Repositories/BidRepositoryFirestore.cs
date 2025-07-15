using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class BidRepositoryFirestore : IBidRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly CollectionReference _collection;

    public BidRepositoryFirestore(FirestoreDb firestoreDb)
    {
        _firestoreDb = firestoreDb;
        _collection = _firestoreDb.Collection("bids");
    }

    public async Task<Bid?> GetHighestBidForLotAsync(string lotId)
    {
        var snapshot = await _collection.WhereEqualTo("LotId", lotId)
                                        .OrderByDescending("Amount")
                                        .Limit(1)
                                        .GetSnapshotAsync();
        if (snapshot.Documents.Count == 0) return null;
        return DocumentToBid(snapshot.Documents[0]);
    }

    // --- Outros métodos ---
    private Bid? DocumentToBid(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;
        var data = snapshot.ToDictionary();
        return new Bid(snapshot.Id, "lotId", "aucId", "uId", "dispName", 0); // Simplificação
    }
    public Task AddAsync(Bid bid) => throw new NotImplementedException();
    public Task<Bid?> GetByIdAsync(string id) => throw new NotImplementedException();
    public Task<List<Bid>> GetBidsByLotIdAsync(string lotId) => throw new NotImplementedException();
    public Task<List<Bid>> GetBidsByUserIdAsync(string userId) => throw new NotImplementedException();
    public Task<List<Bid>> GetBidsByAuctionIdAsync(string auctionId) => throw new NotImplementedException();
}
