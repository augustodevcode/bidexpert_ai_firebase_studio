using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record ReviewDto
{
    public string Id { get; init; } = string.Empty;
    public string LotId { get; init; } = string.Empty;
    public string AuctionId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string UserDisplayName { get; init; } = string.Empty;
    public double Rating { get; init; } // Changed from number to double
    public string Comment { get; init; } = string.Empty;
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
