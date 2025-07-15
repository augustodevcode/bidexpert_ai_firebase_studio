using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using System.Security.Claims;
using System.Text; // Para StringBuilder

namespace BidExpert_Blazor.ApiService.Api.Endpoints;

public static class LotEndpoints
{
    public static void MapLotEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lots").WithTags("Lots");

        group.MapPost("/{lotId}/toggle-favorite", async (string lotId, HttpContext context, ILotApplicationService lotService) => {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var result = await lotService.ToggleFavoriteStatusAsync(lotId, userId);
            return result.Succeeded ? Results.Ok(new { message = result.Message }) : Results.BadRequest(new { message = result.Message });
        })
        .WithName("ToggleFavoriteLot");
        // .RequireAuthorization();

        group.MapGet("/{lotId}/report", async (string lotId, IAuctionApplicationService auctionService, IPdfGenerationService pdfService) => {
            var lotResult = await auctionService.GetLotDetailsAsync(lotId);
            if (!lotResult.Succeeded || lotResult.Data == null)
            {
                return Results.NotFound(new { message = "Lot not found." });
            }

            var lot = lotResult.Data;

            // Gerar HTML simples
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append("<html><body>");
            htmlBuilder.Append($"<h1>Relatório do Lote: {lot.Title}</h1>");
            htmlBuilder.Append($"<p><strong>ID:</strong> {lot.PublicId}</p>");
            htmlBuilder.Append($"<p><strong>Preço Atual:</strong> {lot.Price:C}</p>");
            htmlBuilder.Append($"<p><strong>Descrição:</strong> {lot.Description}</p>");
            htmlBuilder.Append("</body></html>");

            var pdfBytes = await pdfService.GeneratePdfFromHtmlAsync(htmlBuilder.ToString());

            return Results.File(pdfBytes, "application/pdf", $"relatorio_lote_{lot.PublicId}.pdf");
        })
        .WithName("GetLotReportPdf")
        .Produces(200, typeof(FileContentResult))
        .Produces(404);
    }
}
