using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record SellerProfileInfoDto
{
    public string Id { get; init; } = string.Empty;
    public string PublicId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
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
    public int? ActiveLotsCount { get; init; }
    public decimal? TotalSalesValue { get; init; } // Changed from number to decimal for currency
    public int? AuctionsFacilitatedCount { get; init; }
    public string? UserId { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public string? Cnpj { get; init; }
    public string? RazaoSocial { get; init; }
    public string? InscricaoEstadual { get; init; }
}
