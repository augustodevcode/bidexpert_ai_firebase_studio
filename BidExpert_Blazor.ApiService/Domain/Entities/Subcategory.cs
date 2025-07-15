using System;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class Subcategory {
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Slug { get; private set; }
    public string ParentCategoryId { get; private set; }
    public string? Description { get; private set; }
    public int ItemCount { get; internal set; }
    public int DisplayOrder { get; private set; }
    public string? IconUrl { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public Subcategory(string id, string name, string parentCategoryId, int displayOrder, string? description, string? iconUrl) {
        Id = id; Name = name; Slug = GenerateSlug(name); ParentCategoryId = parentCategoryId; DisplayOrder = displayOrder; Description = description; IconUrl = iconUrl;
        CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow; ItemCount = 0;
    }
    public void UpdateDetails(string name, string? description, int displayOrder, string? iconUrl) {
        Name = name; Slug = GenerateSlug(name); Description = description; DisplayOrder = displayOrder; IconUrl = iconUrl; UpdatedAt = DateTimeOffset.UtcNow;
    }
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
