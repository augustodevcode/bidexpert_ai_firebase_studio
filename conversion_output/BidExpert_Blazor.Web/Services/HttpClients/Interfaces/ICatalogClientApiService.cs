using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ServiceDefaults.Dtos;
// Reutilizando PagedResultDto de IAuctionClientApiService.cs ou de um local compartilhado.
// public record PagedResultDto<T>(List<T> Items, int TotalCount, int PageNumber, int PageSize, int TotalPages, bool HasPreviousPage, bool HasNextPage);

// Parâmetros de Query para o catálogo, se diferentes dos da App Layer ou se precisarem de adaptação no cliente.
public class CatalogClientQueryParameters
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SearchTerm { get; set; }
    // Outros filtros específicos para diferentes tipos de catálogo podem ser adicionados.
}


namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public interface ICatalogClientApiService
{
    // Categorias e Subcategorias
    Task<List<LotCategoryDto>?> GetLotCategoriesAsync();
    Task<LotCategoryDto?> GetLotCategoryDetailsAsync(string categoryIdOrSlug);
    Task<List<SubcategoryDto>?> GetSubcategoriesAsync(string parentCategoryIdOrSlug);
    Task<SubcategoryDto?> GetSubcategoryDetailsAsync(string subcategoryId);

    // Estados e Cidades
    Task<List<StateInfoDto>?> GetStatesAsync();
    Task<List<CityInfoDto>?> GetCitiesByStateAsync(string stateUfOrId);

    // Leiloeiros e Vendedores (listagens públicas)
    Task<PagedResultDto<AuctioneerProfileInfoDto>?> GetAuctioneersAsync(CatalogClientQueryParameters queryParams);
    Task<AuctioneerProfileInfoDto?> GetAuctioneerDetailsAsync(string auctioneerIdOrSlug);

    Task<PagedResultDto<SellerProfileInfoDto>?> GetSellersAsync(CatalogClientQueryParameters queryParams);
    Task<SellerProfileInfoDto?> GetSellerDetailsAsync(string sellerIdOrSlug);

    // Configurações da Plataforma (parte pública, se houver)
    // Ex: Task<PublicPlatformSettingsDto?> GetPublicPlatformSettingsAsync();
    // As configurações completas geralmente são protegidas.

    // DocumentTypes (para formulários de upload, por exemplo)
    Task<List<DocumentTypeDto>?> GetDocumentTypesAsync();

    // Outros dados de catálogo que podem ser necessários (ex: Marcas, Modelos de veículos se forem entidades separadas)
}
