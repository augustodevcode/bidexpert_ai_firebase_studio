using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Commands.Auctions;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace BidExpert_Blazor.ApiService.Api.Endpoints;

public static class AuctionEndpoints
{
    public static void MapAuctionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auctions").WithTags("Auctions");
        var lotsGroup = app.MapGroup("/api/lots").WithTags("Lots");

        group.MapGet("/", async ([AsParameters] AuctionQueryParameters queryParams, IAuctionApplicationService auctionService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetActiveAuctions");

        group.MapGet("/{auctionId}", async (string auctionId, IAuctionApplicationService auctionService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetAuctionDetails");

        group.MapPost("/", async (CreateAuctionCommand command, IAuctionApplicationService auctionService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("CreateAuction");

        group.MapGet("/{auctionId}/lots", async (string auctionId, IAuctionApplicationService auctionService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetAuctionLots");

        lotsGroup.MapGet("/{lotId}", async (string lotId, IAuctionApplicationService auctionService) => {
             return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetLotDetails");

        lotsGroup.MapPost("/{lotId}/bids", async (string lotId, PlaceBidCommand command, IAuctionApplicationService auctionService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("PlaceBid");

        lotsGroup.MapGet("/{lotId}/bids", async (string lotId, IAuctionApplicationService auctionService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetLotBids");
    }
}
