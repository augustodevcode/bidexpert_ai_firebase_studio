using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class RoleRepositoryFirestore : IRoleRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly CollectionReference _collection;

    public RoleRepositoryFirestore(FirestoreDb firestoreDb)
    {
        _firestoreDb = firestoreDb;
        _collection = _firestoreDb.Collection("roles");
    }

    private Role? DocumentToRole(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;
        var data = snapshot.ToDictionary();

        var id = snapshot.Id;
        var name = data.TryGetValue("Name", out var nameVal) ? (string)nameVal : string.Empty;
        var description = data.TryGetValue("Description", out var descVal) ? (string)descVal : null;
        var permissions = data.TryGetValue("Permissions", out var permVal) && permVal is List<object> permList
            ? permList.Cast<string>().ToList()
            : new List<string>();

        var role = new Role(id, name, description, permissions);
        return role;
    }

    public async Task<Role?> GetByIdAsync(string id)
    {
        var snapshot = await _collection.Document(id).GetSnapshotAsync();
        return DocumentToRole(snapshot);
    }

    public async Task<Role?> GetByNameAsync(string normalizedName)
    {
        var query = _collection.WhereEqualTo("NameNormalized", normalizedName).Limit(1);
        var snapshot = await query.GetSnapshotAsync();
        if (snapshot.Documents.Count == 0) return null;
        return DocumentToRole(snapshot.Documents[0]);
    }

    public async Task<List<Role>> GetAllAsync()
    {
        var snapshot = await _collection.OrderBy("Name").GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToRole(doc)).OfType<Role>().ToList();
    }

    public async Task AddAsync(Role role)
    {
        var docRef = _collection.Document(role.Id);
        var data = new Dictionary<string, object?>
        {
            { "Id", role.Id },
            { "Name", role.Name },
            { "NameNormalized", role.NameNormalized },
            { "Description", role.Description },
            { "Permissions", role.Permissions },
            { "CreatedAt", FieldValue.ServerTimestamp },
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.SetAsync(data);
    }

    public async Task UpdateAsync(Role role)
    {
        var docRef = _collection.Document(role.Id);
        var data = new Dictionary<string, object?>
        {
            { "Name", role.Name },
            { "NameNormalized", role.NameNormalized },
            { "Description", role.Description },
            { "Permissions", role.Permissions },
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.UpdateAsync(data);
    }

    public async Task DeleteAsync(string id)
    {
        await _collection.Document(id).DeleteAsync();
    }

    public async Task EnsureDefaultRolesExistAsync(IEnumerable<Role> defaultRoles)
    {
        var existingRolesSnapshot = await _collection.GetSnapshotAsync();
        var existingRoleNames = new HashSet<string>(existingRolesSnapshot.Documents.Select(d => d.GetValue<string>("Name")));

        var batch = _firestoreDb.StartBatch();
        int newRolesCount = 0;
        foreach (var role in defaultRoles)
        {
            if (!existingRoleNames.Contains(role.Name))
            {
                var docRef = _collection.Document(role.Id);
                var data = new Dictionary<string, object?>
                {
                    { "Id", role.Id },
                    { "Name", role.Name },
                    { "NameNormalized", role.NameNormalized },
                    { "Description", role.Description },
                    { "Permissions", role.Permissions },
                    { "CreatedAt", FieldValue.ServerTimestamp },
                    { "UpdatedAt", FieldValue.ServerTimestamp }
                };
                batch.Set(docRef, data);
                newRolesCount++;
            }
        }

        if(newRolesCount > 0)
        {
            await batch.CommitAsync();
        }
    }
}
