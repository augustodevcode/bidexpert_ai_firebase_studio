using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Application.Commands.Users;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ServiceDefaults.Dtos;

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public record LoginCommand(string Email, string Password);
public record AuthResponse(string Token, UserProfileDataDto User);

public interface IAuthApplicationService
{
    Task<Result<AuthResponse>> LoginAsync(LoginCommand command);
    Task<Result<UserProfileDataDto>> RegisterAsync(RegisterUserCommand command);
}
