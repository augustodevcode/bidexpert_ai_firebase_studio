using System;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class Bid
{
    public string Id { get; private set; }
    public string LotId { get; private set; }
    public string AuctionId { get; private set; }
    public string UserId { get; private set; }
    public string UserDisplayName { get; private set; }
    public decimal Amount { get; private set; }
    public DateTimeOffset Timestamp { get; private set; }
    public bool IsWinningBid { get; internal set; }

    public Bid(string id, string lotId, string auctionId, string userId, string userDisplayName, decimal amount)
    {
        Id = id; LotId = lotId; AuctionId = auctionId; UserId = userId;
        UserDisplayName = userDisplayName; Amount = amount;
        Timestamp = DateTimeOffset.UtcNow; IsWinningBid = false;
    }

    internal void MarkAsWinning(bool isWinning)
    {
        IsWinningBid = isWinning;
    }
}
