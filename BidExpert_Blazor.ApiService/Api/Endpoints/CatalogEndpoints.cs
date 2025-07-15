using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;

namespace BidExpert_Blazor.ApiService.Api.Endpoints;

public static class CatalogEndpoints
{
    public static void MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/catalog").WithTags("Catalog");

        group.MapGet("/categories", async (ICatalogApplicationService catalogService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetAllLotCategories");

        group.MapGet("/categories/{parentId}/subcategories", async (string parentId, ICatalogApplicationService catalogService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetSubcategoriesByParent");

        group.MapGet("/states", async (ICatalogApplicationService catalogService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetAllStates");

        group.MapGet("/states/{stateUfOrId}/cities", async (string stateUfOrId, ICatalogApplicationService catalogService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetCitiesByState");
    }
}
