using System;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record LotDto
{
    public string Id { get; init; } = string.Empty;
    public string PublicId { get; init; } = string.Empty;
    public string AuctionId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Number { get; init; }
    public string ImageUrl { get; init; } = string.Empty;
    public string? DataAiHint { get; init; }
    public List<string>? GalleryImageUrls { get; init; }
    public List<string>? MediaItemIds { get; init; }
    public LotStatus Status { get; init; }
    public string? StateId { get; init; }
    public string? CityId { get; init; }
    public string? CityName { get; init; }
    public string? StateUf { get; init; }
    public string Type { get; init; } = string.Empty; // This will be the main category name
    public string? CategoryId { get; init; } // ID of the main LotCategory
    public string? SubcategoryId { get; init; } // ID of the Subcategory
    public string? SubcategoryName { get; init; } // Name of the subcategory for display
    public int? Views { get; init; }
    public string? AuctionName { get; init; }
    public decimal Price { get; init; } // Price is decimal
    public decimal? InitialPrice { get; init; } // Changed from number to decimal for currency
    public decimal? SecondInitialPrice { get; init; } // Changed from number to decimal for currency
    public decimal? BidIncrementStep { get; init; } // Changed from number to decimal for currency
    public DateTimeOffset? EndDate { get; init; }
    public DateTimeOffset? AuctionDate { get; init; }
    public DateTimeOffset? LotSpecificAuctionDate { get; init; }
    public DateTimeOffset? SecondAuctionDate { get; init; }
    public int? BidsCount { get; init; }
    public bool? IsFavorite { get; init; }
    public bool? IsFeatured { get; init; }
    public string? Description { get; init; }
    public int? Year { get; init; }
    public string? Make { get; init; }
    public string? Model { get; init; }
    public string? Series { get; init; }
    public string? StockNumber { get; init; }
    public string? SellingBranch { get; init; }
    public string? Vin { get; init; }
    public string? VinStatus { get; init; }
    public string? LossType { get; init; }
    public string? PrimaryDamage { get; init; }
    public string? TitleInfo { get; init; }
    public string? TitleBrand { get; init; }
    public string? StartCode { get; init; }
    public bool? HasKey { get; init; }
    public string? Odometer { get; init; }
    public string? AirbagsStatus { get; init; }
    public string? BodyStyle { get; init; }
    public string? EngineDetails { get; init; }
    public string? TransmissionType { get; init; }
    public string? DriveLineType { get; init; }
    public string? FuelType { get; init; }
    public string? Cylinders { get; init; }
    public string? RestraintSystem { get; init; }
    public string? ExteriorInteriorColor { get; init; }
    public string? Options { get; init; }
    public string? ManufacturedIn { get; init; }
    public string? VehicleClass { get; init; }
    public string? VehicleLocationInBranch { get; init; }
    public string? LaneRunNumber { get; init; }
    public string? AisleStall { get; init; }
    public string? ActualCashValue { get; init; }
    public string? EstimatedRepairCost { get; init; }
    public string? SellerName { get; init; }
    public string? SellerId { get; init; }
    public string? AuctioneerName { get; init; }
    public string? AuctioneerId { get; init; }
    public string? Condition { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public double? DiscountPercentage { get; init; } // Changed from number to double
    public List<string>? AdditionalTriggers { get; init; }
    public bool? IsExclusive { get; init; }
    public bool? AllowInstallmentBids { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public string? MapAddress { get; init; }
    public string? MapEmbedUrl { get; init; }
    public string? MapStaticImageUrl { get; init; }
    public string? JudicialProcessNumber { get; init; }
    public string? CourtDistrict { get; init; }
    public string? CourtName { get; init; }
    public string? PublicProcessUrl { get; init; }
    public string? PropertyRegistrationNumber { get; init; }
    public string? PropertyLiens { get; init; }
    public string? KnownDebts { get; init; }
    public string? AdditionalDocumentsInfo { get; init; }
}
