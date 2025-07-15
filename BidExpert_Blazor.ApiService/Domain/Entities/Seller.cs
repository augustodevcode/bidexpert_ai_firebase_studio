using System;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Text;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class Seller
{
    public string Id { get; private set; }
    public string PublicId { get; private set; }
    public string Name { get; private set; }
    public string Slug { get; private set; }

    public string? ContactName { get; private set; }
    public string? Email { get; private set; }
    public string? Phone { get; private set; }
    public AddressValueObject? AddressInfo { get; private set; }

    public string? Website { get; private set; }
    public string? LogoUrl { get; private set; }
    public string? DataAiHintLogo { get; private set; }
    public string? Description { get; private set; }

    public DateTimeOffset? MemberSince { get; private set; }
    public double? Rating { get; internal set; }
    public int ActiveLotsCount { get; internal set; }
    public decimal TotalSalesValue { get; internal set; }
    public int AuctionsFacilitatedCount { get; internal set; }

    public string? UserId { get; private set; }

    public string? Cnpj { get; private set; }
    public string? RazaoSocial { get; private set; }
    public string? InscricaoEstadual { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public Seller(
        string id, string publicId, string name,
        string? email = null, string? userId = null, string? phone = null, AddressValueObject? address = null,
        string? website = null, string? logoUrl = null, string? description = null,
        string? contactName = null, string? cnpj = null, string? razaoSocial = null, string? inscricaoEstadual = null,
        string? dataAiHintLogo = null)
    {
        Id = id; PublicId = publicId; Name = name; Slug = GenerateSlug(name); Email = email; UserId = userId;
        Phone = phone; AddressInfo = address; Website = website; LogoUrl = logoUrl; DataAiHintLogo = dataAiHintLogo;
        Description = description; ContactName = contactName; Cnpj = cnpj; RazaoSocial = razaoSocial; InscricaoEstadual = inscricaoEstadual;
        MemberSince = DateTimeOffset.UtcNow; CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateDetails(
        string name, string? contactName, string? email, string? phone, AddressValueObject? address,
        string? website, string? logoUrl, string? description, string? dataAiHintLogo,
        string? cnpj, string? razaoSocial, string? inscricaoEstadual)
    {
        Name = name; Slug = GenerateSlug(name); ContactName = contactName; Email = email; Phone = phone;
        AddressInfo = address; Website = website; LogoUrl = logoUrl; DataAiHintLogo = dataAiHintLogo;
        Description = description; Cnpj = cnpj; RazaoSocial = razaoSocial; InscricaoEstadual = inscricaoEstadual;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void UpdateStats(int activeLots, decimal totalSales, int auctionsFacilitated, double? rating)
    {
        ActiveLotsCount = activeLots; TotalSalesValue = totalSales; AuctionsFacilitatedCount = auctionsFacilitated; Rating = rating ?? Rating;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    private string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        string str = text.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        StringBuilder stringBuilder = new StringBuilder();
        foreach (char c in str) { if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) stringBuilder.Append(c); }
        str = stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        str = Regex.Replace(str, @"\s+", "-"); str = Regex.Replace(str, @"[^a-z0-9-]", "");
        return str.Trim('-');
    }
}
