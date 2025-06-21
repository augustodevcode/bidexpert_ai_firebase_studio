using System;
using System.Collections.Generic;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record RoleDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string NameNormalized { get; init; } = string.Empty; // name_normalized -> NameNormalized
    public string? Description { get; init; }
    public List<string> Permissions { get; init; } = new List<string>(); // string[] -> List<string>, initialized to empty list
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
