using System;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record DirectSaleOfferDto
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string? DataAiHint { get; init; }
    public List<string>? GalleryImageUrls { get; init; }
    public DirectSaleOfferType OfferType { get; init; }
    public decimal? Price { get; init; }
    public decimal? MinimumOfferPrice { get; init; }
    public string Category { get; init; } = string.Empty;
    public string? LocationCity { get; init; }
    public string? LocationState { get; init; }
    public string SellerName { get; init; } = string.Empty;
    public string? SellerId { get; init; }
    public string? SellerLogoUrl { get; init; }
    public string? DataAiHintSellerLogo { get; init; }
    public DirectSaleOfferStatus Status { get; init; }
    public List<string>? ItemsIncluded { get; init; }
    public List<string>? Tags { get; init; }
    public int? Views { get; init; }
    public int? ProposalsCount { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public string? MapAddress { get; init; }
    public string? MapEmbedUrl { get; init; }
    public string? MapStaticImageUrl { get; init; }
}
