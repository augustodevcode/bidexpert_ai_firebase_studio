using System;
using System.Collections.Generic;
using System.Linq;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class DocumentType {
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public bool IsRequired { get; private set; }
    private readonly List<string> _allowedFormats = new List<string>();
    public IReadOnlyList<string> AllowedFormats => _allowedFormats.AsReadOnly();
    public int DisplayOrder { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public DocumentType(string id, string name, bool isRequired, IEnumerable<string>? allowedFormats, int displayOrder, string? description) {
        Id = id; Name = name; IsRequired = isRequired; Description = description; DisplayOrder = displayOrder;
        if(allowedFormats != null) _allowedFormats.AddRange(allowedFormats.Select(f => f.ToLowerInvariant()).Distinct());
        CreatedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }
     public void UpdateDetails(string name, bool isRequired, IEnumerable<string>? allowedFormats, int displayOrder, string? description) {
         Name = name; IsRequired = isRequired; Description = description; DisplayOrder = displayOrder;
         _allowedFormats.Clear();
         if(allowedFormats != null) _allowedFormats.AddRange(allowedFormats.Select(f => f.ToLowerInvariant()).Distinct());
         UpdatedAt = DateTimeOffset.UtcNow;
     }
}
