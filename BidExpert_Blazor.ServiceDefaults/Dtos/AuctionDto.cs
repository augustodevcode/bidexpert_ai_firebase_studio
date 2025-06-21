using System;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record AuctionDto
{
    public string Id { get; init; } = string.Empty;
    public string PublicId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? FullTitle { get; init; }
    public string? Description { get; init; }
    public AuctionStatus Status { get; init; }
    public string? AuctionType { get; init; } // TODO: Consider creating an enum for 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS'
    public string Category { get; init; } = string.Empty;
    public string? CategoryId { get; init; }
    public string Auctioneer { get; init; } = string.Empty;
    public string? AuctioneerId { get; init; }
    public string? Seller { get; init; }
    public string? SellerId { get; init; }
    public DateTimeOffset? AuctionDate { get; init; }
    public DateTimeOffset? EndDate { get; init; }
    public List<AuctionStageDto>? AuctionStages { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? ImageUrl { get; init; }
    public string? DataAiHint { get; init; }
    public string? DocumentsUrl { get; init; }
    public int? TotalLots { get; init; }
    public int? Visits { get; init; }
    public decimal? InitialOffer { get; init; } // Changed from number to decimal for currency
    public bool? IsFavorite { get; init; }
    public decimal? CurrentBid { get; init; } // Changed from number to decimal for currency
    public int? BidsCount { get; init; }
    public string? SellingBranch { get; init; }
    public string? VehicleLocation { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public string? AuctioneerLogoUrl { get; init; }
    public string? AuctioneerName { get; init; }
    public bool? AutomaticBiddingEnabled { get; init; }
    public bool? AllowInstallmentBids { get; init; }
    public decimal? EstimatedRevenue { get; init; } // Changed from number to decimal for currency
    public decimal? AchievedRevenue { get; init; } // Changed from number to decimal for currency
    public int? TotalHabilitatedUsers { get; init; }
    public bool? IsFeaturedOnMarketplace { get; init; }
    public string? MarketplaceAnnouncementTitle { get; init; }
    public List<LotDto>? Lots { get; init; }
}
