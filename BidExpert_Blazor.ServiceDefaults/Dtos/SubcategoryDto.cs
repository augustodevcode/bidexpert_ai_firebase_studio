using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record SubcategoryDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string ParentCategoryId { get; init; } = string.Empty;
    public string? ParentCategoryName { get; init; }
    public string? Description { get; init; }
    public int? ItemCount { get; init; }
    public int? DisplayOrder { get; init; }
    public string? IconUrl { get; init; }
    public string? DataAiHintIcon { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
