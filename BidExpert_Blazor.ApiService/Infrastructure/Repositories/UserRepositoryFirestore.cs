using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using Google.Cloud.Firestore;
using FirebaseAdmin.Auth;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace BidExpert_Blazor.ApiService.Infrastructure.Repositories;

public class UserRepositoryFirestore : IUserRepository
{
    private readonly FirestoreDb _firestoreDb;
    private readonly FirebaseAuth _firebaseAuth;
    private readonly CollectionReference _collection;

    public UserRepositoryFirestore(FirestoreDb firestoreDb, FirebaseAuth firebaseAuth)
    {
        _firestoreDb = firestoreDb;
        _firebaseAuth = firebaseAuth;
        _collection = _firestoreDb.Collection("users");
    }

    private User? DocumentToUser(DocumentSnapshot snapshot)
    {
        if (!snapshot.Exists) return null;
        var data = snapshot.ToDictionary();

        var uid = snapshot.Id;
        var email = data.TryGetValue("Email", out var emailVal) ? (string)emailVal : string.Empty;
        var fullName = data.TryGetValue("FullName", out var nameVal) ? (string)nameVal : null;
        var roleId = data.TryGetValue("RoleId", out var roleVal) ? (string)roleVal : null;
        var permissions = data.TryGetValue("Permissions", out var permVal) && permVal is List<object> permList
            ? permList.Cast<string>().ToList()
            : new List<string>();

        var user = new User(uid, email, fullName, roleId, permissions);

        if (data.TryGetValue("PasswordHash", out var hashVal))
        {
            user.SetPasswordHash((string)hashVal);
        }

        if (data.TryGetValue("HabilitationStatus", out var statusVal) && Enum.TryParse<Domain.Enums.UserHabilitationStatusDomain>((string)statusVal, out var status))
        {
            user.UpdateHabilitationStatus(status);
        }

        // Mapeamento de outros campos...
        return user;
    }

    public async Task<User?> GetByUidAsync(string uid)
    {
        var snapshot = await _collection.Document(uid).GetSnapshotAsync();
        return DocumentToUser(snapshot);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var query = _collection.WhereEqualTo("Email", email).Limit(1);
        var snapshot = await query.GetSnapshotAsync();
        if (snapshot.Documents.Count == 0) return null;
        return DocumentToUser(snapshot.Documents[0]);
    }

    public async Task<List<User>> GetAllAsync()
    {
        var snapshot = await _collection.OrderBy("FullName").GetSnapshotAsync();
        return snapshot.Documents.Select(doc => DocumentToUser(doc)).OfType<User>().ToList();
    }

    public async Task AddAsync(User user, string? passwordHash)
    {
        if(passwordHash != null)
        {
            user.SetPasswordHash(passwordHash);
        }

        var docRef = _collection.Document(user.Uid);
        var data = new Dictionary<string, object?>
        {
            { "Uid", user.Uid },
            { "Email", user.Email },
            { "PasswordHash", user.PasswordHash },
            { "FullName", user.FullName },
            { "RoleId", user.RoleId },
            // ... outros campos ...
            { "CreatedAt", FieldValue.ServerTimestamp },
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.SetAsync(data, SetOptions.MergeAll);
    }

    public async Task UpdateAsync(User user)
    {
        var docRef = _collection.Document(user.Uid);
        var data = new Dictionary<string, object?>
        {
            { "FullName", user.FullName },
            { "PasswordHash", user.PasswordHash },
            { "RoleId", user.RoleId },
            // ... outros campos ...
            { "UpdatedAt", FieldValue.ServerTimestamp }
        };
        await docRef.UpdateAsync(data.Where(kvp => kvp.Value != null).ToDictionary(kvp => kvp.Key, kvp => kvp.Value!));
    }

    public async Task DeleteAsync(string uid)
    {
        await _collection.Document(uid).DeleteAsync();
        try { await _firebaseAuth.DeleteUserAsync(uid); }
        catch (FirebaseAuthException) { /* Ignorar */ }
    }
}
