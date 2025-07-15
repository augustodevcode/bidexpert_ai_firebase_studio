using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Commands.Users;

namespace BidExpert_Blazor.ApiService.Api.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users").WithTags("Users");

        group.MapGet("/{userId}/profile", async (string userId, IUserApplicationService userService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("GetUserProfile");

        group.MapPost("/register", async (RegisterUserCommand command, IUserApplicationService userService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("RegisterUser");

        group.MapPost("/login", () => {
             return Results.Problem("Not implemented.", statusCode: StatusCodes.Status501NotImplemented);
        }).WithName("LoginUser");

        group.MapPut("/{userId}/profile", async (string userId, UpdateUserProfileCommand command, IUserApplicationService userService) => {
             return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("UpdateUserProfile");
    }
}
