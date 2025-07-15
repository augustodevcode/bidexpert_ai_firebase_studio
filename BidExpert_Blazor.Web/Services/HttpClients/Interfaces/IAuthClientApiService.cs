using System.Threading.Tasks;
using System.Collections.Generic;

namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public record LoginRequestDto(string Email, string Password);
public record RegisterRequestDto(string FullName, string Email, string Password);
public record AuthResponseDto(bool Succeeded, string? Token, string? UserId, List<string>? Errors);

public interface IAuthClientApiService {
    Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest);
}
