using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Net.Http.Json; // Para GetFromJsonAsync, PostAsJsonAsync, etc.
using System.Threading.Tasks;
using System.Collections.Generic; // Para List<string>
using BidExpert_Blazor.ServiceDefaults.Dtos; // Para UserProfileDataDto se AuthResponseDto o incluir

// Os DTOs de Request/Response (LoginRequestDto, AuthResponseDto, etc.) são definidos no arquivo da interface IAuthClientApiService.cs

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class AuthClientApiService : IAuthClientApiService
{
    private readonly HttpClient _httpClient;
    // private readonly Blazored.LocalStorage.ILocalStorageService _localStorage; // Exemplo se usar localStorage para token

    public AuthClientApiService(HttpClient httpClient /*, Blazored.LocalStorage.ILocalStorageService localStorage*/)
    {
        _httpClient = httpClient ?? throw new System.ArgumentNullException(nameof(httpClient));
        // _localStorage = localStorage;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest)
    {
        // HttpResponseMessage response = await _httpClient.PostAsJsonAsync("api/auth/login", loginRequest);
        // if (response.IsSuccessStatusCode)
        // {
        //     var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        //     if (authResponse != null && authResponse.Succeeded && !string.IsNullOrEmpty(authResponse.Token))
        //     {
        //         // await _localStorage.SetItemAsStringAsync("authToken", authResponse.Token);
        //         // Atualizar estado de autenticação na aplicação (ex: via AuthenticationStateProvider customizado)
        //     }
        //     return authResponse ?? new AuthResponseDto(false, null, null, null, new List<string> { "Erro ao desserializar resposta." }, "Erro na resposta");
        // }
        // else
        // {
        //     // Tentar ler erros do corpo da resposta se houver
        //     // var errorResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>(); // Ou um DTO de erro genérico
        //     // return errorResponse ?? new AuthResponseDto(false, null, null, null, new List<string> { $"Erro: {response.StatusCode}" }, $"Erro HTTP: {response.StatusCode}");
        // }
        await Task.CompletedTask; // Remover após implementação
        throw new System.NotImplementedException();
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest)
    {
        // HttpResponseMessage response = await _httpClient.PostAsJsonAsync("api/auth/register", registerRequest);
        // if (response.IsSuccessStatusCode)
        // {
        //     return await response.Content.ReadFromJsonAsync<AuthResponseDto>() ?? new AuthResponseDto(false, null, null, null, new List<string> { "Erro ao desserializar resposta." }, "Erro na resposta");
        // }
        // else
        // {
        //     // var errorResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        //     // return errorResponse ?? new AuthResponseDto(false, null, null, null, new List<string> { $"Erro: {response.StatusCode}" }, $"Erro HTTP: {response.StatusCode}");
        // }
        await Task.CompletedTask; // Remover após implementação
        throw new System.NotImplementedException();
    }

    public Task<AuthResponseDto> ChangePasswordAsync(ChangePasswordRequestDto changePasswordRequest) => throw new System.NotImplementedException();
    public Task<AuthResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest) => throw new System.NotImplementedException();
    public Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest) => throw new System.NotImplementedException();

    // public async Task LogoutAsync()
    // {
    //     // await _localStorage.RemoveItemAsync("authToken");
    //     // Notificar AuthenticationStateProvider para atualizar o estado.
    //     // Opcionalmente, chamar um endpoint de API para invalidar o token/sessão no servidor.
    //     // await _httpClient.PostAsync("api/auth/logout", null);
    // }
}
