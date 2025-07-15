using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ApiService.Application.Commands.Users;
using BidExpert_Blazor.ApiService.Domain.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public record UserQueryParameters(int PageNumber, int PageSize, string? SortBy, bool SortAscending, string? SearchTerm);


public interface IUserApplicationService {
    Task<Result<UserProfileDataDto>> GetUserProfileAsync(string userId);
    Task<Result<UserProfileWithPermissionsDto>> GetUserProfileWithPermissionsAsync(string userId);
    Task<Result<UserProfileDataDto>> RegisterUserAsync(RegisterUserCommand command);
    Task<Result> UpdateUserProfileAsync(string userId, UpdateUserProfileCommand command);
    Task<Result<List<RoleDto>>> GetAvailableRolesAsync();
    Task<Result<RoleDto>> CreateRoleAsync(CreateRoleCommand command);
    Task<Result> UpdateUserHabilitationStatusAsync(string userId, UserHabilitationStatusDomain newStatus);
    Task<PagedResult<UserProfileDataDto>> GetUsersAsync(UserQueryParameters queryParams);
}
