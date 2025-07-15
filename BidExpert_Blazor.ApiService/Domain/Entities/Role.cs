using System;
using System.Collections.Generic;
using System.Linq;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class Role
{
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string NameNormalized { get; private set; }
    public string? Description { get; private set; }
    private readonly List<string> _permissions = new List<string>();
    public IReadOnlyList<string> Permissions => _permissions.AsReadOnly();
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }


    public Role(string id, string name, string? description, IEnumerable<string>? permissions)
    {
        if (string.IsNullOrWhiteSpace(id)) throw new ArgumentNullException(nameof(id));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentNullException(nameof(name));
        Id = id;
        Name = name;
        NameNormalized = name.ToUpperInvariant();
        Description = description;
        if (permissions != null) _permissions.AddRange(permissions.Distinct());
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateDetails(string name, string? description, IEnumerable<string>? permissions)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentNullException(nameof(name));
        Name = name;
        NameNormalized = name.ToUpperInvariant();
        Description = description;
        _permissions.Clear();
        if (permissions != null) _permissions.AddRange(permissions.Distinct());
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AddPermission(string permission)
    {
        if (!string.IsNullOrWhiteSpace(permission) && !_permissions.Contains(permission))
        {
            _permissions.Add(permission);
            UpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    public void RemovePermission(string permission)
    {
        _permissions.Remove(permission);
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
