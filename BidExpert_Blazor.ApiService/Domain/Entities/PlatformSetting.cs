using System;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class ThemeSetting {
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, string> Colors { get; set; } = new();
}

public record PlatformPublicIdMasksValueObject(string? Auctions, string? Lots, string? Auctioneers, string? Sellers);
public record MentalTriggerSettingsValueObject(bool? ShowDiscountBadge, bool? ShowUrgencyTimer, int? UrgencyTimerThresholdDays, int? UrgencyTimerThresholdHours, bool? ShowPopularityBadge, int? PopularityViewThreshold, bool? ShowHotBidBadge, int? HotBidThreshold, bool? ShowExclusiveBadge);
public record BadgeVisibilitySettingsValueObject(bool? ShowStatusBadge, bool? ShowDiscountBadge, bool? ShowUrgencyTimer, bool? ShowPopularityBadge, bool? ShowHotBidBadge, bool? ShowExclusiveBadge);
public record SectionBadgeConfigValueObject(BadgeVisibilitySettingsValueObject? FeaturedLots, BadgeVisibilitySettingsValueObject? SearchGrid, BadgeVisibilitySettingsValueObject? SearchList, BadgeVisibilitySettingsValueObject? LotDetail);
public record PromoCardContentValueObject(string Title, string? Subtitle, string Link, string? ImageUrl, string? ImageAlt, string? DataAiHint, string? BgColorClass);
public record HomepageSectionConfigValueObject(string Id, HomepageSectionType Type, string? Title, bool Visible, int Order, int? ItemCount, string? CategorySlug, PromoCardContentValueObject? PromoContent);
public record MapSettingsValueObject(string? DefaultProvider, string? GoogleMapsApiKey, int? StaticImageMapZoom, string? StaticImageMapMarkerColor);

public class PlatformSetting {
    public string Id { get; private set; } = "global";
    public string? SiteTitle { get; private set; }
    public string? SiteTagline { get; private set; }
    public string GalleryImageBasePath { get; private set; }
    public string? ActiveThemeName { get; private set; }
    public List<ThemeSetting> Themes { get; private set; } = new();
    public PlatformPublicIdMasksValueObject? PlatformPublicIdMasks { get; private set; }
    public List<HomepageSectionConfigValueObject> HomepageSections { get; private set; } = new();
    public MentalTriggerSettingsValueObject? MentalTriggerSettings { get; private set; }
    public SectionBadgeConfigValueObject? SectionBadgeVisibility { get; private set; }
    public MapSettingsValueObject? MapSettings { get; private set; }
    public SearchPaginationType? SearchPaginationType { get; private set; }
    public int? SearchItemsPerPage { get; private set; }
    public int? SearchLoadMoreCount { get; private set; }
    public bool? ShowCountdownOnLotDetail { get; private set; }
    public bool? ShowCountdownOnCards { get; private set; }
    public bool? ShowRelatedLotsOnLotDetail { get; private set; }
    public int? RelatedLotsCount { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public PlatformSetting(string galleryImageBasePath) {
        GalleryImageBasePath = galleryImageBasePath;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateSettings(
        string? siteTitle, string? siteTagline, string? galleryImageBasePath, string? activeThemeName,
        List<ThemeSetting>? themes, PlatformPublicIdMasksValueObject? publicIdMasks,
        List<HomepageSectionConfigValueObject>? homepageSections, MentalTriggerSettingsValueObject? mentalTriggers,
        SectionBadgeConfigValueObject? sectionBadges, MapSettingsValueObject? mapSettings,
        SearchPaginationType? searchPagination, int? itemsPerPage, int? loadMoreCount,
        bool? showCountdownDetail, bool? showCountdownCards, bool? showRelatedLots, int? relatedLotsCount)
    {
        SiteTitle = siteTitle ?? SiteTitle;
        SiteTagline = siteTagline ?? SiteTagline;
        GalleryImageBasePath = galleryImageBasePath ?? GalleryImageBasePath;
        ActiveThemeName = activeThemeName ?? ActiveThemeName;
        Themes = themes ?? Themes;
        PlatformPublicIdMasks = publicIdMasks ?? PlatformPublicIdMasks;
        HomepageSections = homepageSections ?? HomepageSections;
        MentalTriggerSettings = mentalTriggers ?? MentalTriggerSettings;
        SectionBadgeVisibility = sectionBadges ?? SectionBadgeVisibility;
        MapSettings = mapSettings ?? MapSettings;
        SearchPaginationType = searchPagination ?? SearchPaginationType;
        SearchItemsPerPage = itemsPerPage ?? SearchItemsPerPage;
        SearchLoadMoreCount = loadMoreCount ?? SearchLoadMoreCount;
        ShowCountdownOnLotDetail = showCountdownDetail ?? ShowCountdownOnLotDetail;
        ShowCountdownOnCards = showCountdownCards ?? ShowCountdownOnCards;
        ShowRelatedLotsOnLotDetail = showRelatedLots ?? ShowRelatedLotsOnLotDetail;
        RelatedLotsCount = relatedLotsCount ?? RelatedLotsCount;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
