using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Commands.Users;

namespace BidExpert_Blazor.ApiService.Api.Endpoints;

public record AdminUserQueryParameters(int PageNumber = 1, int PageSize = 20, string? RoleFilter = null, string? SearchTerm = null);

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var adminGroup = app.MapGroup("/api/admin").WithTags("Administration");

        var usersAdminGroup = adminGroup.MapGroup("/users").WithTags("Admin - Users");

        usersAdminGroup.MapGet("/", async ([AsParameters] AdminUserQueryParameters queryParams, IUserApplicationService userService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("AdminGetAllUsers");

        usersAdminGroup.MapPut("/{userId}/role", async (string userId, [FromBody] AssignRoleRequest request, IUserApplicationService userService) => {
            // var command = new AssignRoleToUserCommand(userId, request.RoleId);
            // await userService.AssignRoleToUserAsync(command);
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("AdminAssignRoleToUser");

        var rolesAdminGroup = adminGroup.MapGroup("/roles").WithTags("Admin - Roles");

        rolesAdminGroup.MapGet("/", async (IUserApplicationService userService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("AdminGetRoles");

        rolesAdminGroup.MapPost("/", async (CreateRoleCommand command, IUserApplicationService userService) => {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
        }).WithName("AdminCreateRole");
    }
}

public record AssignRoleRequest(string RoleId);
