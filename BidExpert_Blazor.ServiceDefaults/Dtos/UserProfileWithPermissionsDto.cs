using System.Collections.Generic;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

// UserProfileWithPermissionsDto inherits from UserProfileDataDto.
// In TypeScript, UserProfileWithPermissions makes 'permissions' mandatory.
// UserProfileDataDto already has 'public List<string>? Permissions { get; init; }'.
// While C# 10+ allows `required` properties, for broadest compatibility and given
// the base property is nullable, we'll rely on consuming code or constructors
// (if we were to define them explicitly) to ensure 'Permissions' is populated
// when creating an instance of UserProfileWithPermissionsDto.
// For a simple DTO, just inheriting is often sufficient, and business logic
// handles validation of required fields.
public record UserProfileWithPermissionsDto : UserProfileDataDto
{
    // No new properties are added here as 'Permissions' is inherited.
    // The expectation is that when an instance of UserProfileWithPermissionsDto is created,
    // the Permissions property will be non-null, enforced by the creating logic.
    // If a stricter contract is needed at the type level, one might consider:
    // 1. Not using inheritance and redefining all properties.
    // 2. Adding a constructor that requires 'Permissions'.
    // 3. Using `required` modifier if C# 11+ is targeted and appropriate.

    // For now, simple inheritance is used. The inherited 'Permissions' property will be used.
    // public new List<string> Permissions { get; init; } = new List<string>(); // This would hide and require initialization.
}
