using System.Threading.Tasks;
using System.Collections.Generic; // Para List
using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums; // Para UserHabilitationStatus, UserDocumentStatusDomain

// DTOs para requests específicos do UserClient, se diferentes dos DTOs de ServiceDefaults
// ou dos Comandos da Application Layer. Por enquanto, assumimos que podemos usar/adaptar os existentes.
// Exemplo: UpdateUserProfileCommand já definido em IUserApplicationService.cs (placeholder)
// public record UpdateUserProfileClientCommand(string FullName, string? Cpf, string? CellPhone, ...);
// public record UploadDocumentClientRequest(string DocumentTypeId, byte[] FileContent, string FileName, string MimeType);


namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public interface IUserClientApiService
{
    // Perfil do Usuário Logado
    Task<UserProfileDataDto?> GetMyProfileAsync();
    Task<bool> UpdateMyProfileAsync(UpdateUserProfileCommand profileUpdateCommand); // Reutilizando comando da App Layer

    // Lances e Arremates do Usuário Logado
    Task<List<UserBidDto>?> GetMyActiveBidsAsync();
    Task<List<UserWinDto>?> GetMyWinsAsync();
    Task<List<LotDto>?> GetMyFavoriteLotsAsync(); // Assumindo que DTO e endpoint existem
    Task<bool> AddLotToFavoritesAsync(string lotId);
    Task<bool> RemoveLotFromFavoritesAsync(string lotId);

    // Documentos do Usuário Logado
    Task<List<UserDocumentDto>?> GetMyDocumentsAsync();
    // Task<UserDocumentDto?> UploadMyDocumentAsync(UploadDocumentClientRequest documentRequest);
    // O upload real pode ser um FormData e não um DTO JSON, ou um endpoint específico.

    // Habilitação
    Task<UserHabilitationStatus?> GetMyHabilitationStatusAsync(); // Simplificado

    // Notificações (se houver um sistema de notificação)
    // Task<List<NotificationDto>?> GetMyNotificationsAsync(bool markAsRead = false);
    // Task<int> GetMyUnreadNotificationCountAsync();
}

// Reutilizando comandos definidos em IUserApplicationService.cs (placeholders) para consistência.
// Se o cliente tiver modelos de formulário diferentes, eles seriam mapeados para estes comandos antes da chamada HTTP.
// public record UpdateUserProfileCommand(string FullName, string? Cpf, string? CellPhone, DateTimeOffset? DateOfBirth, ...);
// public record UploadUserDocumentCommand(string UserId, string DocumentTypeId, string FileName, byte[] FileContent, string MimeType, string? DocumentTypeNameForUser);
