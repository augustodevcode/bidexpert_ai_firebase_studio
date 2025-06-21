using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record StateInfoDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Uf { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public int? CityCount { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
