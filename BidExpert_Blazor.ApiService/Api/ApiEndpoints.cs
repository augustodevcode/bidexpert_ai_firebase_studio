using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Api.Endpoints.Users;
using BidExpert_Blazor.ApiService.Api.Endpoints.Auctions;
using BidExpert_Blazor.ApiService.Api.Endpoints.Catalog;
using BidExpert_Blazor.ApiService.Api.Endpoints.Platform;
using BidExpert_Blazor.ApiService.Api.Endpoints.Admin;
using BidExpert_Blazor.ApiService.Api.Endpoints.Auth;
using BidExpert_Blazor.ApiService.Api.Endpoints; // Namespace para LotEndpoints
using Microsoft.AspNetCore.Builder;

namespace BidExpert_Blazor.ApiService.Api;

public static class ApiEndpoints
{
    public static void MapAllApiEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapAuthEndpoints();
        app.MapUserEndpoints();
        app.MapAuctionEndpoints();
        app.MapLotEndpoints(); // Adicionado
        app.MapCatalogEndpoints();
        app.MapPlatformEndpoints();
        app.MapAdminEndpoints();
    }
}
