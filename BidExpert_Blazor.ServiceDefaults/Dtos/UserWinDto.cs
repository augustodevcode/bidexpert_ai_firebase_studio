using System;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record UserWinDto
{
    public string Id { get; init; } = string.Empty;
    public LotDto Lot { get; init; } = new LotDto(); // Assuming Lot will always be present
    public decimal WinningBidAmount { get; init; } // Changed from number to decimal for currency
    public DateTimeOffset? WinDate { get; init; }
    public PaymentStatus PaymentStatus { get; init; }
    public string? InvoiceUrl { get; init; }
}
