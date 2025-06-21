using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record AuctioneerProfileInfoDto
{
    public string Id { get; init; } = string.Empty;
    public string PublicId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? RegistrationNumber { get; init; }
    public string? ContactName { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? ZipCode { get; init; }
    public string? Website { get; init; }
    public string? LogoUrl { get; init; }
    public string? DataAiHintLogo { get; init; }
    public string? Description { get; init; }
    public DateTimeOffset? MemberSince { get; init; }
    public double? Rating { get; init; }
    public int? AuctionsConductedCount { get; init; }
    public decimal? TotalValueSold { get; init; } // Changed from number to decimal for currency
    public string? UserId { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}
