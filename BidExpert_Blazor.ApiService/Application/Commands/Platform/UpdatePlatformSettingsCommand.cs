using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ApiService.Application.Commands.Platform;

public record UpdatePlatformSettingsCommand(
    string? SiteTitle,
    string? SiteTagline,
    string GalleryImageBasePath,
    string? ActiveThemeName,
    List<ThemeDto> Themes,
    PlatformPublicIdMasksDto? PlatformPublicIdMasks,
    List<HomepageSectionConfigDto> HomepageSections,
    MentalTriggerSettingsDto? MentalTriggerSettings,
    SectionBadgeConfigDto? SectionBadgeVisibility,
    MapSettingsDto? MapSettings,
    SearchPaginationType? SearchPaginationType,
    int? SearchItemsPerPage,
    int? SearchLoadMoreCount,
    bool? ShowCountdownOnLotDetail,
    bool? ShowCountdownOnCards,
    bool? ShowRelatedLotsOnLotDetail,
    int? RelatedLotsCount
);
