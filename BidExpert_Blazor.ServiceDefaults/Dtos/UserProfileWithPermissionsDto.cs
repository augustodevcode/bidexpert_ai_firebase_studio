using System.Collections.Generic;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record UserProfileWithPermissionsDto : UserProfileDataDto
{
    // Esta classe herda todas as propriedades de UserProfileDataDto.
    // A distinção é conceitual: uma instância de UserProfileWithPermissionsDto
    // deve ter a propriedade 'Permissions' populada, enquanto em UserProfileDataDto
    // ela pode ser nula. A validação dessa regra ocorreria na camada de aplicação/serviço.
}
