using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record LotCategoryDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int? ItemCount { get; init; }
    public bool? HasSubcategories { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
