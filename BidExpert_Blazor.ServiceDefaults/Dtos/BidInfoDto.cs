using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record BidInfoDto
{
    public string Id { get; init; } = string.Empty;
    public string LotId { get; init; } = string.Empty;
    public string AuctionId { get; init; } = string.Empty;
    public string BidderId { get; init; } = string.Empty;
    public string BidderDisplay { get; init; } = string.Empty;
    public decimal Amount { get; init; } // Changed from number to decimal for currency
    public DateTimeOffset? Timestamp { get; init; }
}
