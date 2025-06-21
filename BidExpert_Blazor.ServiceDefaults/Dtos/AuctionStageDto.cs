using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record AuctionStageDto
{
    public string Name { get; init; } = string.Empty;
    public DateTimeOffset? EndDate { get; init; }
    public string? StatusText { get; init; }
    public decimal? InitialPrice { get; init; } // Changed from number to decimal for currency
}
