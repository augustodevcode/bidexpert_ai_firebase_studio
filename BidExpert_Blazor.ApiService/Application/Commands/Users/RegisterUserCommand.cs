namespace BidExpert_Blazor.ApiService.Application.Commands.Users;

public record RegisterUserCommand(string Email, string Password, string FullName, string? RoleId);
