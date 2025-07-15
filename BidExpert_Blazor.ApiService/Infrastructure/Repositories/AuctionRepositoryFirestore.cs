using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Enums;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class AuctionRepositoryFirestore : IAuctionRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly CollectionReference _collection;

    public AuctionRepositoryFirestore(FirestoreDb firestoreDb)
    {
        _firestoreDb = firestoreDb;
        _collection = _firestoreDb.Collection("auctions");
    }

    public async Task<(List<Auction> Auctions, int TotalCount)> GetPagedAuctionsAsync(AuctionFilterParams filterParams)
    {
        Query query = _collection;

        // Aplicar filtros
        if (!string.IsNullOrEmpty(filterParams.Status))
        {
            query = query.WhereEqualTo("Status", filterParams.Status);
        }
        if (!string.IsNullOrEmpty(filterParams.CategoryId))
        {
            query = query.WhereEqualTo("CategoryId", filterParams.CategoryId);
        }
        // Firestore não suporta busca de texto parcial nativamente.
        // Uma solução real usaria um serviço de busca como Algolia/Elasticsearch,
        // ou uma abordagem mais simples com arrays de keywords.
        // Por enquanto, este filtro de SearchTerm não será implementado.

        // Obter contagem total com filtros aplicados
        var countSnapshot = await query.GetSnapshotAsync();
        var totalCount = countSnapshot.Count;

        // Aplicar ordenação e paginação
        query = query.OrderByDescending("AuctionDate")
                     .Limit(filterParams.PageSize)
                     .Offset((filterParams.PageNumber - 1) * filterParams.PageSize);

        var snapshot = await query.GetSnapshotAsync();
        var auctions = snapshot.Documents.Select(doc => DocumentToAuction(doc)).OfType<Auction>().ToList();

        return (auctions, totalCount);
    }

    private Auction? DocumentToAuction(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;
        var data = snapshot.ToDictionary();
        var auction = new Auction(
            snapshot.Id,
            data.TryGetValue("PublicId", out var pid) ? (string)pid : string.Empty,
            data.TryGetValue("Title", out var t) ? (string)t : string.Empty,
            data.TryGetValue("Status", out var s) && Enum.TryParse<AuctionStatusDomain>((string)s, out var status) ? status : AuctionStatusDomain.Draft,
            data.TryGetValue("CategoryId", out var cid) ? (string)cid : string.Empty,
            data.TryGetValue("AuctioneerId", out var aid) ? (string)aid : string.Empty,
            data.TryGetValue("AuctionDate", out var ad) && ad is Timestamp adt ? adt.ToDateTimeOffset() : DateTimeOffset.MinValue,
            data.TryGetValue("SellerId", out var sellerId) ? (string)sellerId : null,
            data.TryGetValue("InitialOffer", out var io) ? Convert.ToDecimal(io) : null,
            false, false // Simplificação
        );
        return auction;
    }

    // --- Implementações existentes e placeholders ---
    public async Task<Auction?> GetByIdAsync(string id)
    {
        var snapshot = await _collection.Document(id).GetSnapshotAsync();
        return DocumentToAuction(snapshot);
    }
    public async Task<Auction?> GetByPublicIdAsync(string publicId)
    {
        var query = _collection.WhereEqualTo("PublicId", publicId).Limit(1);
        var snapshot = await query.GetSnapshotAsync();
        if (snapshot.Documents.Count == 0) return null;
        return DocumentToAuction(snapshot.Documents[0]);
    }
    public async Task<List<Auction>> GetAllAsync()
    {
        var snapshot = await _collection.OrderByDescending("AuctionDate").GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToAuction(doc)).OfType<Auction>().ToList();
    }
    public async Task<List<Auction>> GetByStatusAsync(AuctionStatusDomain status)
    {
        var snapshot = await _collection.WhereEqualTo("Status", status.ToString()).GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToAuction(doc)).OfType<Auction>().ToList();
    }
    public Task<List<Auction>> GetByAuctioneerIdAsync(string auctioneerId) => throw new NotImplementedException();
    public Task<List<Auction>> GetBySellerIdAsync(string sellerId) => throw new NotImplementedException();
    public Task<List<Auction>> GetByCategoryIdAsync(string categoryId) => throw new NotImplementedException();
    public async Task AddAsync(Auction auction)
    {
        var docRef = _collection.Document(auction.Id);
        var data = new Dictionary<string, object?> { /* ... */ };
        await docRef.SetAsync(data);
    }
    public async Task UpdateAsync(Auction auction)
    {
        var docRef = _collection.Document(auction.Id);
        var data = new Dictionary<string, object?> { /* ... */ };
        await docRef.UpdateAsync(data);
    }
    public async Task DeleteAsync(string id)
    {
        await _collection.Document(id).DeleteAsync();
    }
    public async Task<bool> PublicIdExistsAsync(string publicId)
    {
        var snapshot = await _collection.WhereEqualTo("PublicId", publicId).Limit(1).GetSnapshotAsync();
        return snapshot.Documents.Count > 0;
    }
}
