using System.Collections.Generic;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record DocumentTypeDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsRequired { get; init; }
    public List<string>? AllowedFormats { get; init; }
    public int? DisplayOrder { get; init; }
}
