using System;
using System.Text.RegularExpressions;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class LotCategory {
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Slug { get; private set; }
    public string? Description { get; private set; }
    public int ItemCount { get; internal set; }
    public bool HasSubcategories { get; internal set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public LotCategory(string id, string name, string? description) {
        Id = id; Name = name; Slug = GenerateSlug(name); Description = description; ItemCount = 0; HasSubcategories = false;
        CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void UpdateDetails(string name, string? description) {
        Name = name; Slug = GenerateSlug(name); Description = description; UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void SetHasSubcategories(bool value) { HasSubcategories = value; UpdatedAt = DateTimeOffset.UtcNow; }
    private string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        string str = text.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        StringBuilder stringBuilder = new StringBuilder();
        foreach (char c in str)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) stringBuilder.Append(c);
        }
        str = stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        str = Regex.Replace(str, @"\s+", "-");
        str = Regex.Replace(str, @"[^a-z0-9-]", "");
        return str.Trim('-');
    }
}
