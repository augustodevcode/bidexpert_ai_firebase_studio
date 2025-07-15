using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record CityInfoDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string StateId { get; init; } = string.Empty;
    public string StateUf { get; init; } = string.Empty;
    public string? IbgeCode { get; init; }
    public int? LotCount { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
