using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Commands.Users;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using BidExpert_Blazor.ApiService.Domain.Enums;

namespace BidExpert_Blazor.ApiService.Api.Endpoints.Admin;

public record AdminUserQueryParameters(int PageNumber = 1, int PageSize = 20, string? SortBy = null, bool SortAscending = true, string? SearchTerm = null);
// ... (outros records)

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin").WithTags("Admin");

        var usersAdminGroup = group.MapGroup("/users");

        usersAdminGroup.MapGet("/", async ([AsParameters] AdminUserQueryParameters queryParams, IUserApplicationService userService) => {
            var serviceParams = new UserQueryParameters(
                queryParams.PageNumber,
                queryParams.PageSize,
                queryParams.SortBy,
                queryParams.SortAscending,
                queryParams.SearchTerm
            );
            var result = await userService.GetUsersAsync(serviceParams);
            return result.Succeeded ? Results.Ok(result) : Results.BadRequest(result.Errors);
        }).WithName("AdminGetAllUsers");

        // ... (outros endpoints de admin)
    }
}
