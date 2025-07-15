using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Commands.Platform;

namespace BidExpert_Blazor.ApiService.Api.Endpoints.Platform;

public static class PlatformEndpoints
{
    public static void MapPlatformEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/platform-settings").WithTags("Platform Settings");

        group.MapGet("/", async (IPlatformSettingApplicationService platformService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetPlatformSettings");

        group.MapPut("/", async (UpdatePlatformSettingsCommand command, IPlatformSettingApplicationService platformService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("UpdatePlatformSettings");
    }
}
