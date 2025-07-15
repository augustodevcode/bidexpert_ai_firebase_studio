using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Commands.Auctions;
using BidExpert_Blazor.ApiService.Application.Results;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic; // Para List

namespace BidExpert_Blazor.ApiService.Api.Endpoints.Auctions;

public static class AuctionEndpoints
{
    public static void MapAuctionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auctions").WithTags("Auctions");
        var lotsGroup = app.MapGroup("/api/lots").WithTags("Lots");

        group.MapGet("/", async ([AsParameters] AuctionQueryParameters queryParams, IAuctionApplicationService auctionService) => {
            // A implementação deste serviço ainda está pendente
            // var result = await auctionService.GetActiveAuctionsAsync(queryParams);
            // return result.Succeeded && result.Data != null
            //     ? Results.Ok(result)
            //     : Results.BadRequest(new { result.Message, result.Errors });
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetActiveAuctions").Produces<PagedResult<AuctionDto>>().ProducesValidationProblem();

        group.MapGet("/{auctionId}", async (string auctionId, IAuctionApplicationService auctionService) => {
            var result = await auctionService.GetAuctionDetailsAsync(auctionId);
            return result.Succeeded && result.Data != null ? Results.Ok(result.Data) : Results.NotFound(new { result.Message });
        }).WithName("GetAuctionDetails").Produces<AuctionDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateAuctionCommand command, IAuctionApplicationService auctionService) => {
            var result = await auctionService.CreateAuctionAsync(command);
            if (!result.Succeeded) return Results.BadRequest(new { result.Message, result.Errors });
            return Results.Created($"/api/auctions/{result.Data?.Id}", result.Data);
        }).WithName("CreateAuction").Produces<AuctionDto>(StatusCodes.Status201Created).Produces<object>(StatusCodes.Status400BadRequest);

        group.MapGet("/{auctionId}/lots", async (string auctionId, [AsParameters] AuctionQueryParameters queryParams, IAuctionApplicationService auctionService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetAuctionLots").Produces<PagedResult<LotDto>>();

        lotsGroup.MapGet("/{lotId}", async (string lotId, IAuctionApplicationService auctionService) => {
             var result = await auctionService.GetLotDetailsAsync(lotId);
             return result.Succeeded && result.Data != null ? Results.Ok(result.Data) : Results.NotFound(new { result.Message });
        }).WithName("GetLotDetails").Produces<LotDto>().Produces(StatusCodes.Status404NotFound);

        lotsGroup.MapPost("/{lotId}/bids", async (string lotId, PlaceBidCommand command, IAuctionApplicationService auctionService) => {
            // Nota: O comando pode precisar ser ajustado para não receber o lotId duas vezes.
            // Aqui estamos passando o lotId da rota para o método de serviço.
            var result = await auctionService.PlaceBidAsync(lotId, command);
            return result.Succeeded && result.Data != null
                ? Results.Ok(result.Data)
                : Results.BadRequest(new { result.Message, result.Errors });
        }).WithName("PlaceBid").Produces<BidInfoDto>().Produces<object>(StatusCodes.Status400BadRequest);
        // .RequireAuthorization();

        lotsGroup.MapGet("/{lotId}/bids", async (string lotId, IAuctionApplicationService auctionService) => {
            // A implementação deste serviço ainda está pendente
            // var result = await auctionService.GetBidsForLotAsync(lotId);
            // return result.Succeeded && result.Data != null
            //     ? Results.Ok(result.Data)
            //     : Results.BadRequest(new { result.Message, result.Errors });
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetLotBids").Produces<List<BidInfoDto>>();
    }
}
