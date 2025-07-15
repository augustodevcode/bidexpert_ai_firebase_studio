using System;
using System.Collections.Generic;
using BidExpert_Blazor.ApiService.Domain.Enums;
namespace BidExpert_Blazor.ApiService.Domain.Entities;
public class Auction {
    public string Id { get; private set; }
    public string PublicId { get; private set; }
    public string Title { get; private set; }
    public string? FullTitle { get; private set; }
    public string? Description { get; private set; }
    public AuctionStatusDomain Status { get; private set; }
    public AuctionTypeDomain? AuctionType { get; private set; }
    public string CategoryId { get; private set; }
    public string AuctioneerId { get; private set; }
    public string? SellerId { get; private set; }
    public DateTimeOffset AuctionDate { get; private set; }
    public DateTimeOffset? EndDate { get; private set; }
    private readonly List<AuctionStage> _auctionStages = new List<AuctionStage>();
    public IReadOnlyList<AuctionStage> AuctionStages => _auctionStages.AsReadOnly();
    public string? City { get; private set; }
    public string? State { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? DocumentsUrl { get; private set; }
    public int TotalLots { get; internal set; }
    public int Visits { get; internal set; }
    public decimal? InitialOffer { get; private set; }
    public decimal? CurrentHighestBid { get; internal set; }
    public int BidsCount { get; internal set; }
    public bool AutomaticBiddingEnabled { get; private set; }
    public bool AllowInstallmentBids { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    private readonly List<string> _lotIds = new List<string>();
    public IReadOnlyList<string> LotIds => _lotIds.AsReadOnly();

    public Auction(string id, string publicId, string title, AuctionStatusDomain status, string categoryId, string auctioneerId, DateTimeOffset auctionDate, string? sellerId, decimal? initialOffer, bool autoBids, bool installmentBids, string? fullTitle = null, string? description = null, string? city = null, string? stateAbbr = null, string? imageUrl = null, string? docsUrl = null, AuctionTypeDomain? auctionType = null) {
        Id = id; PublicId = publicId; Title = title; Status = status; CategoryId = categoryId; AuctioneerId = auctioneerId; AuctionDate = auctionDate; SellerId = sellerId; InitialOffer = initialOffer; AutomaticBiddingEnabled = autoBids; AllowInstallmentBids = installmentBids; FullTitle = fullTitle; Description = description; City = city; State = stateAbbr; ImageUrl = imageUrl; DocumentsUrl = docsUrl; AuctionType = auctionType;
        CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow; Visits = 0; BidsCount = 0; TotalLots = 0;
    }
    public void UpdateDetails(string title, string? fullTitle, string? description, string categoryId, DateTimeOffset auctionDate, DateTimeOffset? endDate, string? city, string? stateAbbr, string? imageUrl, string? docsUrl, decimal? initialOffer, bool autoBids, bool installmentBids, AuctionTypeDomain? auctionType) {
        Title=title; FullTitle=fullTitle; Description=description; CategoryId=categoryId; AuctionDate=auctionDate; EndDate=endDate; City=city; State=stateAbbr; ImageUrl=imageUrl; DocumentsUrl=docsUrl; InitialOffer=initialOffer; AutomaticBiddingEnabled=autoBids; AllowInstallmentBids=installmentBids; AuctionType = auctionType; UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void AddStage(AuctionStage stage) { _auctionStages.Add(stage); UpdatedAt = DateTimeOffset.UtcNow; }
    public void ClearStages() { _auctionStages.Clear(); UpdatedAt = DateTimeOffset.UtcNow; }
    public void AddLotId(string lotId) { if (!_lotIds.Contains(lotId)) _lotIds.Add(lotId); TotalLots = _lotIds.Count; UpdatedAt = DateTimeOffset.UtcNow; }
    public void RemoveLotId(string lotId) { _lotIds.Remove(lotId); TotalLots = _lotIds.Count; UpdatedAt = DateTimeOffset.UtcNow; }
    public void ChangeStatus(AuctionStatusDomain newStatus) { Status = newStatus; UpdatedAt = DateTimeOffset.UtcNow; }
}
