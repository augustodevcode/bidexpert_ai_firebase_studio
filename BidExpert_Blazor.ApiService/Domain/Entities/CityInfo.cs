using System;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Text;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class CityInfo
{
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Slug { get; private set; }
    public string StateId { get; private set; }
    public string StateUf { get; private set; }
    public string? IbgeCode { get; private set; }
    public int LotCount { get; internal set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public CityInfo(string id, string name, string stateId, string stateUf, string? ibgeCode = null)
    {
        Id = id; Name = name; Slug = GenerateSlug(name); StateId = stateId; StateUf = stateUf.ToUpperInvariant();
        IbgeCode = ibgeCode; LotCount = 0; CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateDetails(string name, string? ibgeCode)
    {
        Name = name; Slug = GenerateSlug(name); IbgeCode = ibgeCode;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void SetLotCount(int count) { LotCount = count >= 0 ? count : 0; UpdatedAt = DateTimeOffset.UtcNow; }

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
