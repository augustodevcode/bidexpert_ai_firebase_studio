using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Commands.Users; // Para RegisterUserCommand

namespace BidExpert_Blazor.ApiService.Api.Endpoints.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/register", async (RegisterUserCommand command, IAuthApplicationService authService) => {
            var result = await authService.RegisterAsync(command);
            if (!result.Succeeded) return Results.BadRequest(new { result.Message, result.Errors });
            return Results.Created($"/api/users/{result.Data?.Uid}", result.Data);
        })
        .WithName("RegisterUser")
        .Produces<UserProfileDataDto>(StatusCodes.Status201Created)
        .Produces<object>(StatusCodes.Status400BadRequest);

        group.MapPost("/login", async (LoginCommand command, IAuthApplicationService authService) => {
            var result = await authService.LoginAsync(command);
            if (!result.Succeeded) return Results.Unauthorized(); // Ou BadRequest dependendo do erro
            return Results.Ok(result.Data);
        })
        .WithName("LoginUser")
        .Produces<AuthResponse>()
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
