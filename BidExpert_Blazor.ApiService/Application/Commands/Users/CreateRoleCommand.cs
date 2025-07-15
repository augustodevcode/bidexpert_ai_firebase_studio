using System.Collections.Generic;

namespace BidExpert_Blazor.ApiService.Application.Commands.Users;

public record CreateRoleCommand(string Name, string? Description, List<string> Permissions);
