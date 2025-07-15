using System;
using System.Collections.Generic;
using BidExpert_Blazor.ApiService.Domain.Enums;
using System.Linq;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public record AddressValueObject(string? Street, string? City, string? State, string? ZipCode, string? Complement, string? Neighborhood, string? Number);

public class User
{
    public string Uid { get; private set; }
    public string Email { get; private set; }
    public string? PasswordHash { get; private set; } // Adicionado
    public string? FullName { get; private set; }
    public string? RoleId { get; private set; }
    private readonly List<string> _permissions = new List<string>();
    public IReadOnlyList<string> Permissions => _permissions.AsReadOnly();
    public UserHabilitationStatusDomain HabilitationStatus { get; private set; }
    public string? Cpf { get; private set; }
    public string? CellPhone { get; private set; }
    public DateTimeOffset? DateOfBirth { get; private set; }
    public string? AvatarUrl { get; private set; }
    public AddressValueObject? Address { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public User(string uid, string email, string? fullName, string? roleId, IEnumerable<string>? initialPermissions)
    {
        if (string.IsNullOrWhiteSpace(uid)) throw new ArgumentNullException(nameof(uid));
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentNullException(nameof(email));
        Uid = uid;
        Email = email;
        FullName = fullName;
        RoleId = roleId;
        if(initialPermissions != null) _permissions.AddRange(initialPermissions.Distinct());
        HabilitationStatus = UserHabilitationStatusDomain.PendingDocuments;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateProfile(string? fullName, string? cpf, string? cellPhone, DateTimeOffset? dateOfBirth, string? avatarUrl, AddressValueObject? address)
    {
        FullName = fullName ?? FullName;
        Cpf = cpf ?? Cpf;
        CellPhone = cellPhone ?? CellPhone;
        DateOfBirth = dateOfBirth ?? DateOfBirth;
        AvatarUrl = avatarUrl ?? AvatarUrl;
        Address = address ?? Address;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AssignRole(string? roleId, IEnumerable<string> rolePermissions)
    {
        RoleId = roleId;
        _permissions.Clear();
        if(rolePermissions != null) _permissions.AddRange(rolePermissions.Distinct());
        UpdatedAt = DateTimeOffset.UtcNow;
    }
     public void ForceSetPermissions(IEnumerable<string> permissions)
    {
        _permissions.Clear();
        if(permissions != null) _permissions.AddRange(permissions.Distinct());
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void UpdateHabilitationStatus(UserHabilitationStatusDomain newStatus)
    {
        HabilitationStatus = newStatus;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
