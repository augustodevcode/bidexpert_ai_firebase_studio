using System;
using System.Collections.Generic;
using BidExpert_Blazor.ApiService.Domain.Enums;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums; // Para AuctionStatus vindo do DTO

namespace BidExpert_Blazor.ApiService.Application.Commands.Auctions;

public record CreateAuctionStageCommand(
    string Name,
    DateTimeOffset EndDate,
    decimal? InitialPrice,
    string? StatusText
);

public record CreateAuctionCommand(
    string Title,
    string? FullTitle,
    string? Description,
    AuctionStatus Status,
    AuctionTypeDomain AuctionType,
    string CategoryId,
    string CategoryName,
    string AuctioneerId,
    string AuctioneerName,
    string? SellerId,
    string? SellerName,
    DateTimeOffset AuctionDate,
    List<CreateAuctionStageCommand> AuctionStages,
    string? City,
    string? State,
    string? ImageUrl,
    string? DataAiHint,
    string? DocumentsUrl,
    bool AutomaticBiddingEnabled,
    bool AllowInstallmentBids,
    bool IsFeaturedOnMarketplace,
    string? MarketplaceAnnouncementTitle,
    string? AuctioneerLogoUrl
);
