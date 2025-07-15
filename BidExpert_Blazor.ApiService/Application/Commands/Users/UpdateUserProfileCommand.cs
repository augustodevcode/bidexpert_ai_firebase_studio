using System;

namespace BidExpert_Blazor.ApiService.Application.Commands.Users;

public record UpdateUserProfileCommand(
    string FullName,
    string? Cpf,
    string? CellPhone,
    DateTimeOffset? DateOfBirth,
    string? AvatarUrl,
    string? Street,
    string? City,
    string? State,
    string? ZipCode,
    string? Complement,
    string? Neighborhood,
    string? Number
);
