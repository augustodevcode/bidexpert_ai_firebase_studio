using System;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record UserBidDto
{
    public string Id { get; init; } = string.Empty;
    public string LotId { get; init; } = string.Empty;
    public string AuctionId { get; init; } = string.Empty;
    public string LotTitle { get; init; } = string.Empty;
    public string LotImageUrl { get; init; } = string.Empty;
    public string? LotImageAiHint { get; init; }
    public decimal UserBidAmount { get; init; } // Changed from number to decimal for currency
    public decimal CurrentLotPrice { get; init; } // Changed from number to decimal for currency
    public UserBidStatus BidStatus { get; init; }
    public DateTimeOffset? BidDate { get; init; }
    public DateTimeOffset? LotEndDate { get; init; }
}
