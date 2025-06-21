using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums; // Para enums de filtro
using System; // Para DateTimeOffset

// DTO para PagedResult, pode ser genérico e estar em ServiceDefaults ou um namespace comum de DTOs de resposta.
// Colocando aqui por simplicidade para esta fase de geração.
public record PagedResultDto<T>(
    List<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages,
    bool HasPreviousPage,
    bool HasNextPage
);

// DTOs para requests específicos de PlaceBid, se necessário (pode usar partes do BidInfoDto ou um comando dedicado)
public record PlaceBidRequestDto(decimal Amount /*, outros campos se necessários como UserId, que viria do estado de auth*/);

// Parâmetros de Query para leilões e lotes
public class AuctionClientQueryParameters
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; } // Usar string para enums na query string
    public string? CategoryId { get; set; }
    public string? AuctioneerId { get; set; }
    public string? SellerId { get; set; }
    public string? SearchTerm { get; set; }
    public string? SortBy { get; set; } // ex: "endDate", "title"
    public bool SortAscending { get; set; } = true;
    public string? AuctionType { get; set; } // Usar string para enums
}

public class LotClientQueryParameters
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? AuctionId { get; set; }
    public string? Status { get; set; }
    public string? CategoryId { get; set; }
    public string? SearchTerm { get; set; }
    public string? SortBy { get; set; }
    public bool SortAscending { get; set; } = true;
}


namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public interface IAuctionClientApiService
{
    Task<AuctionDto?> GetAuctionDetailsAsync(string auctionIdOrPublicId);
    Task<PagedResultDto<AuctionDto>?> GetAuctionsAsync(AuctionClientQueryParameters queryParams);
    Task<AuctionDto?> CreateAuctionAsync(CreateAuctionCommand command); // Usando comando da Application Layer se o cliente o conhecer
    Task<bool> UpdateAuctionAsync(string auctionId, UpdateAuctionCommand command);

    Task<LotDto?> GetLotDetailsAsync(string lotIdOrPublicId);
    Task<PagedResultDto<LotDto>?> GetLotsByAuctionAsync(string auctionIdOrPublicId, LotClientQueryParameters queryParams);
    Task<PagedResultDto<LotDto>?> SearchLotsAsync(LotClientQueryParameters queryParams);
    Task<LotDto?> CreateLotAsync(CreateLotCommand command);
    Task<bool> UpdateLotAsync(string lotId, UpdateLotCommand command);

    Task<BidInfoDto?> PlaceBidAsync(string lotId, PlaceBidRequestDto bidRequest);
    Task<List<BidInfoDto>?> GetBidsForLotAsync(string lotId);
}

// Comandos da Application Layer (ou DTOs equivalentes) que o cliente precisa conhecer para criar/atualizar.
// Estes são duplicados das interfaces de serviço de aplicação para ilustração.
// Idealmente, seriam parte de um pacote compartilhado se não usar ServiceDefaults DTOs diretamente para comandos.
public record CreateAuctionStageCommand(string Name, DateTimeOffset EndDate, decimal? InitialPrice, string? StatusText);
public record CreateAuctionCommand(
    string Title, string? FullTitle, string? Description, AuctionStatus Status, AuctionTypeDomain AuctionType,
    string CategoryId, string CategoryName, string AuctioneerId, string AuctioneerName, string? SellerId, string? SellerName,
    DateTimeOffset AuctionDate, List<CreateAuctionStageCommand> AuctionStages, string? City, string? State,
    string? ImageUrl, string? DataAiHint, string? DocumentsUrl, bool AutomaticBiddingEnabled, bool AllowInstallmentBids,
    bool IsFeaturedOnMarketplace, string? MarketplaceAnnouncementTitle, string? AuctioneerLogoUrl);

public record UpdateAuctionCommand(
    string Title, string? FullTitle, string? Description, AuctionStatus Status, AuctionTypeDomain AuctionType,
    string CategoryId, string CategoryName, string AuctioneerId, string AuctioneerName, string? SellerId, string? SellerName,
    DateTimeOffset AuctionDate, DateTimeOffset? EndDate, List<CreateAuctionStageCommand> AuctionStages, string? City, string? State,
    string? ImageUrl, string? DataAiHint, string? DocumentsUrl, bool AutomaticBiddingEnabled, bool AllowInstallmentBids,
    bool IsFeaturedOnMarketplace, string? MarketplaceAnnouncementTitle, string? AuctioneerLogoUrl);

public record CreateLotCommand(
    string AuctionId, string Title, string? Number, string ImageUrl, string? DataAiHint, List<string>? GalleryImageUrls, List<string>? MediaItemIds,
    string CategoryId, string CategoryName, string? SubcategoryId, string? SubcategoryName, string? StateId, string? CityId, string? CityName, string? StateUf,
    decimal Price, decimal? SecondInitialPrice, decimal? BidIncrementStep, DateTimeOffset? LotSpecificAuctionDate, DateTimeOffset? SecondAuctionDate,
    string? Description, int? Year, string? Make, string? Model, string? Vin, bool IsFeatured, bool AllowInstallmentBids);

public record UpdateLotCommand(
    string Title, string? Number, string ImageUrl, string? DataAiHint, List<string>? GalleryImageUrls, List<string>? MediaItemIds,
    string CategoryId, string CategoryName, string? SubcategoryId, string? SubcategoryName, string? StateId, string? CityId, string? CityName, string? StateUf,
    decimal Price, decimal? SecondInitialPrice, decimal? BidIncrementStep, DateTimeOffset? LotSpecificAuctionDate, DateTimeOffset? SecondAuctionDate,
    LotStatus Status, string? Description, int? Year, string? Make, string? Model, string? Vin, bool IsFeatured, bool AllowInstallmentBids);
