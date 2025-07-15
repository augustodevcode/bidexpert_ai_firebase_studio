using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc; // Para [FromForm]

namespace BidExpert_Blazor.ApiService.Api.Endpoints.Users;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users/me").WithTags("Current User");
        // .RequireAuthorization();

        group.MapGet("/profile", async (HttpContext context, IUserApplicationService userService) => { /* ... */ });
        group.MapPut("/profile", async (HttpContext context, /* ... */ IUserApplicationService userService) => { /* ... */ });
        group.MapGet("/bids", async (HttpContext context, IAuctionApplicationService auctionService) => { /* ... */ });
        group.MapGet("/wins", async (HttpContext context, ILotApplicationService lotService) => { /* ... */ });
        group.MapGet("/favorites", async (HttpContext context, ILotApplicationService lotService) => { /* ... */ });

        group.MapGet("/documents", async (HttpContext context, IDocumentApplicationService docService) => {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
            var result = await docService.GetUserDocumentsAsync(userId);
            return Results.Ok(result.Data);
        }).WithName("GetMyDocuments");

        group.MapPost("/documents", async (HttpContext context, [FromForm] IFormFile file, [FromForm] string documentTypeId, IDocumentApplicationService docService) => {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
            var command = new UploadDocumentCommand(userId, documentTypeId, file);
            var result = await docService.UploadDocumentAsync(command);
            return result.Succeeded ? Results.Ok(result.Data) : Results.BadRequest(result.Message);
        }).WithName("UploadMyDocument").DisableAntiforgery(); // Necessário para upload de formulário de Blazor Wasm
    }
}
