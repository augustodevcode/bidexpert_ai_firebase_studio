using System;
using System.Collections.Generic;
using BidExpert_Blazor.ServiceDefaults.Dtos.Enums;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record UserProfileDataDto
{
    public string Uid { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public string? Password { get; init; }
    public string? RoleId { get; init; }
    public string? RoleName { get; init; }
    public List<string>? Permissions { get; init; }
    public UserHabilitationStatus? HabilitationStatus { get; init; }
    public string? Cpf { get; init; }
    public string? RgNumber { get; init; }
    public string? RgIssuer { get; init; }
    public DateTimeOffset? RgIssueDate { get; init; }
    public string? RgState { get; init; }
    public DateTimeOffset? DateOfBirth { get; init; }
    public string? CellPhone { get; init; }
    public string? HomePhone { get; init; }
    public string? Gender { get; init; }
    public string? Profession { get; init; }
    public string? Nationality { get; init; }
    public string? MaritalStatus { get; init; }
    public string? PropertyRegime { get; init; }
    public string? SpouseName { get; init; }
    public string? SpouseCpf { get; init; }
    public string? ZipCode { get; init; }
    public string? Street { get; init; }
    public string? Number { get; init; }
    public string? Complement { get; init; }
    public string? Neighborhood { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Status { get; init; }
    public bool? OptInMarketing { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public string? AvatarUrl { get; init; }
    public string? DataAiHint { get; init; }
    public int? ActiveBids { get; init; }
    public int? AuctionsWon { get; init; }
    public int? ItemsSold { get; init; }
    public string? SellerProfileId { get; init; }
    public string? AccountType { get; init; }
    public string? RazaoSocial { get; init; }
    public string? Cnpj { get; init; }
    public string? InscricaoEstadual { get; init; }
    public string? WebsiteComitente { get; init; }
}
