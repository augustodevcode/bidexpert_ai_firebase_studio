using System;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

// Sub-DTOs for PlatformSettingsDto

public record ThemeColorsDto
{
    // In TypeScript, this is `[colorVariable: string]: string;`
    // In C#, a Dictionary is a common way to represent this.
    public Dictionary<string, string> Colors { get; init; } = new Dictionary<string, string>();
}

public record ThemeDto
{
    public string Name { get; init; } = string.Empty;
    public ThemeColorsDto Colors { get; init; } = new ThemeColorsDto();
}

public record MentalTriggerSettingsDto
{
    public bool? ShowDiscountBadge { get; init; }
    public bool? ShowUrgencyTimer { get; init; }
    public int? UrgencyTimerThresholdDays { get; init; }
    public int? UrgencyTimerThresholdHours { get; init; }
    public bool? ShowPopularityBadge { get; init; }
    public int? PopularityViewThreshold { get; init; }
    public bool? ShowHotBidBadge { get; init; }
    public int? HotBidThreshold { get; init; } // Assuming int, could be double if needed
    public bool? ShowExclusiveBadge { get; init; }
}

public record BadgeVisibilitySettingsDto
{
    public bool? ShowStatusBadge { get; init; }
    public bool? ShowDiscountBadge { get; init; }
    public bool? ShowUrgencyTimer { get; init; }
    public bool? ShowPopularityBadge { get; init; }
    public bool? ShowHotBidBadge { get; init; }
    public bool? ShowExclusiveBadge { get; init; }
}

public record SectionBadgeConfigDto
{
    public BadgeVisibilitySettingsDto? FeaturedLots { get; init; }
    public BadgeVisibilitySettingsDto? SearchGrid { get; init; }
    public BadgeVisibilitySettingsDto? SearchList { get; init; }
    public BadgeVisibilitySettingsDto? LotDetail { get; init; }
}

public record PromoCardContentDto
{
    public string Title { get; init; } = string.Empty;
    public string? Subtitle { get; init; }
    public string Link { get; init; } = string.Empty;
    public string? ImageUrl { get; init; }
    public string? ImageAlt { get; init; }
    public string? DataAiHint { get; init; }
    public string? BgColorClass { get; init; }
}

public record HomepageSectionConfigDto
{
    public string Id { get; init; } = string.Empty;
    public HomepageSectionType Type { get; init; }
    public string? Title { get; init; }
    public bool Visible { get; init; }
    public int Order { get; init; }
    public int? ItemCount { get; init; }
    public string? CategorySlug { get; init; }
    public PromoCardContentDto? PromoContent { get; init; }
}

public record MapSettingsDto
{
    public string? DefaultProvider { get; init; } // TODO: Consider enum for 'google' | 'openstreetmap' | 'staticImage'
    public string? GoogleMapsApiKey { get; init; }
    public int? StaticImageMapZoom { get; init; }
    public string? StaticImageMapMarkerColor { get; init; }
}

public record PlatformPublicIdMasksDto
{
    public string? Auctions { get; init; }
    public string? Lots { get; init; }
    public string? Auctioneers { get; init; }
    public string? Sellers { get; init; }
}

// Main PlatformSettingsDto
public record PlatformSettingsDto
{
    public string Id { get; init; } = "global"; // Fixed value in TS
    public string? SiteTitle { get; init; }
    public string? SiteTagline { get; init; }
    public string GalleryImageBasePath { get; init; } = string.Empty;
    public string? ActiveThemeName { get; init; }
    public List<ThemeDto>? Themes { get; init; }
    public PlatformPublicIdMasksDto? PlatformPublicIdMasks { get; init; }
    public List<HomepageSectionConfigDto>? HomepageSections { get; init; }
    public MentalTriggerSettingsDto? MentalTriggerSettings { get; init; }
    public SectionBadgeConfigDto? SectionBadgeVisibility { get; init; }
    public MapSettingsDto? MapSettings { get; init; }
    public SearchPaginationType? SearchPaginationType { get; init; }
    public int? SearchItemsPerPage { get; init; }
    public int? SearchLoadMoreCount { get; init; }
    public bool? ShowCountdownOnLotDetail { get; init; }
    public bool? ShowCountdownOnCards { get; init; }
    public bool? ShowRelatedLotsOnLotDetail { get; init; }
    public int? RelatedLotsCount { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
