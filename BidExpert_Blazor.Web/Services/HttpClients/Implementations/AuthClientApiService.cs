using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace BidExpert_Blazor.Web.Services.HttpClients.Implementations;

public class AuthClientApiService : IAuthClientApiService
{
    private readonly HttpClient _httpClient;

    public AuthClientApiService(HttpClient httpClient)
    {
        _httpClient = httpClient ?? throw new System.ArgumentNullException(nameof(httpClient));
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("api/auth/login", loginRequest);

            if (response.IsSuccessStatusCode)
            {
                var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
                return authResponse ?? new AuthResponseDto(false, null, null, null, new() { "Failed to deserialize response." }, "Response Error");
            }
            else
            {
                var errorResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
                return errorResponse ?? new AuthResponseDto(false, null, null, null, new() { $"HTTP Error: {response.StatusCode}" }, "HTTP Error");
            }
        }
        catch(Exception ex)
        {
            return new AuthResponseDto(false, null, null, null, new() { ex.Message }, "Request Exception");
        }
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("api/auth/register", registerRequest);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<AuthResponseDto>() ?? new AuthResponseDto(false, null, null, null, new() { "Failed to deserialize response." }, "Response Error");
            }
            else
            {
                var errorResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
                return errorResponse ?? new AuthResponseDto(false, null, null, null, new() { $"HTTP Error: {response.StatusCode}" }, "HTTP Error");
            }
        }
        catch(Exception ex)
        {
            return new AuthResponseDto(false, null, null, null, new() { ex.Message }, "Request Exception");
        }
    }
}
