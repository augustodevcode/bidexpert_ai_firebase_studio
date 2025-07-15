using System;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Text;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class StateInfo
{
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Uf { get; private set; }
    public string Slug { get; private set; }
    public int CityCount { get; internal set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public StateInfo(string id, string name, string uf)
    {
        Id = id; Name = name; Uf = uf.ToUpperInvariant(); Slug = GenerateSlug(name);
        CityCount = 0; CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateDetails(string name, string uf)
    {
        Name = name; Uf = uf.ToUpperInvariant(); Slug = GenerateSlug(name);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void SetCityCount(int count) { CityCount = count >= 0 ? count : 0; UpdatedAt = DateTimeOffset.UtcNow; }

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
