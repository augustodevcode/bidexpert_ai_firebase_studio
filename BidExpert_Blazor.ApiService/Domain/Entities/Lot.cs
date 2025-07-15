using System;
using System.Collections.Generic;
using BidExpert_Blazor.ApiService.Domain.Enums;
namespace BidExpert_Blazor.ApiService.Domain.Entities;
public class Lot {
    public string Id { get; private set; }
    public string PublicId { get; private set; }
    public string AuctionId { get; private set; }
    public string Title { get; private set; }
    public string? Number { get; private set; }
    public string? Description { get; private set; }
    public LotStatusDomain Status { get; private set; }
    public string CategoryId { get; private set; }
    public string? SubcategoryId { get; private set; }
    public decimal Price { get; internal set; }
    public decimal? InitialPrice { get; private set; }
    public string? WinnerUserId { get; private set; }
    public decimal? WinningBidAmount { get; private set; }
    public DateTimeOffset? ClosedAt { get; private set; }
    // ... outras propriedades ...
    private readonly List<string> _favoriteUserIds = new List<string>();
    public IReadOnlyList<string> FavoriteUserIds => _favoriteUserIds.AsReadOnly();
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public Lot(string id, string publicId, string auctionId, string title, string categoryId, decimal initialPrice, string? number, string? description, string? subcategoryId) {
        Id=id; PublicId=publicId; AuctionId=auctionId; Title=title; CategoryId=categoryId; Price=initialPrice; InitialPrice=initialPrice; Number=number; Description=description; SubcategoryId=subcategoryId;
        Status = LotStatusDomain.Draft; CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void UpdateDetails(string title, string? description, string categoryId, string? subcategoryId, decimal initialPrice) {
         Title=title; Description=description; CategoryId=categoryId; SubcategoryId=subcategoryId; InitialPrice=initialPrice; Price = (Status == LotStatusDomain.OpenForBids) ? initialPrice : Price; UpdatedAt = DateTimeOffset.UtcNow;
     }
    public void ChangeStatus(LotStatusDomain newStatus) { Status = newStatus; UpdatedAt = DateTimeOffset.UtcNow; }
    public void RecordBid(decimal newPrice) { Price = newPrice; /* BidsCount++; */ UpdatedAt = DateTimeOffset.UtcNow; }
    public void ToggleFavorite(string userId)
    {
        if (_favoriteUserIds.Contains(userId)) _favoriteUserIds.Remove(userId);
        else _favoriteUserIds.Add(userId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void CloseAsSold(string winnerId, decimal winningAmount)
    {
        if (Status == LotStatusDomain.OpenForBids || Status == LotStatusDomain.Closed)
        {
            WinnerUserId = winnerId;
            WinningBidAmount = winningAmount;
            Price = winningAmount;
            Status = LotStatusDomain.Sold;
            ClosedAt = DateTimeOffset.UtcNow;
            UpdatedAt = DateTimeOffset.UtcNow;
        }
    }
    public void CloseAsNotSold()
    {
        if (Status == LotStatusDomain.OpenForBids || Status == LotStatusDomain.Closed)
        {
            Status = LotStatusDomain.NotSold;
            ClosedAt = DateTimeOffset.UtcNow;
            UpdatedAt = DateTimeOffset.UtcNow;
        }
    }
}
