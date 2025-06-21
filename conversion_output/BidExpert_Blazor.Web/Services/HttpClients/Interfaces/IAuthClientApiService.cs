using System.Threading.Tasks;
using System.Collections.Generic; // Para List<string>
using BidExpert_Blazor.ServiceDefaults.Dtos; // Para UserProfileDataDto se AuthResponseDto o incluir

// DTOs específicos para request/response de Autenticação
// Estes podem ser movidos para ServiceDefaults.Dtos se forem ser compartilhados com o ApiService
// ou podem ser específicos do cliente se o ApiService usar outros modelos para seus endpoints.

public record LoginRequestDto(string Email, string Password, bool RememberMe = false);

public record RegisterRequestDto(
    string FullName,
    string Email,
    string Password,
    string ConfirmPassword,
    string? AccountType, // "PHYSICAL", "LEGAL"
    string? Cpf,
    string? CellPhone,
    System.DateTimeOffset? DateOfBirth,
    // Campos PJ
    string? RazaoSocial,
    string? Cnpj,
    bool AcceptTerms
);

public record AuthResponseDto(
    bool Succeeded,
    string? Token, // JWT Token
    string? UserId,
    UserProfileDataDto? UserProfile, // Opcional, para retornar dados do perfil no login/registro
    List<string>? Errors,
    string? Message
);

public record ChangePasswordRequestDto(string CurrentPassword, string NewPassword, string ConfirmNewPassword);
public record ForgotPasswordRequestDto(string Email);
public record ResetPasswordRequestDto(string Email, string Token, string NewPassword, string ConfirmNewPassword);


namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public interface IAuthClientApiService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest);
    Task<AuthResponseDto> ChangePasswordAsync(ChangePasswordRequestDto changePasswordRequest);
    Task<AuthResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest);
    Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest);
    // Logout é geralmente uma ação do lado do cliente (limpar token, estado)
    // mas pode haver um endpoint de API para invalidar refresh tokens no servidor.
    // Task LogoutAsync();
}
