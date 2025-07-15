using System;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class Review
{
    public string Id { get; private set; }
    public string LotId { get; private set; }
    public string AuctionId { get; private set; }
    public string UserId { get; private set; }
    public string UserDisplayName { get; private set; }
    public double Rating { get; private set; }
    public string Comment { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public bool IsApproved { get; internal set; }

    public Review(string id, string lotId, string auctionId, string userId, string userDisplayName, double rating, string comment)
    {
        Id = id; LotId = lotId; AuctionId = auctionId; UserId = userId;
        UserDisplayName = userDisplayName; Rating = rating; Comment = comment;
        IsApproved = false; CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateReview(double rating, string comment)
    {
        Rating = rating; Comment = comment; IsApproved = false; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ApproveReview() { IsApproved = true; UpdatedAt = DateTimeOffset.UtcNow; }
    public void RejectReview() { IsApproved = false; UpdatedAt = DateTimeOffset.UtcNow; }
}
