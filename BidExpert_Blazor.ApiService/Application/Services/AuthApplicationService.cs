using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Application.Commands.Users;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Results;
using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BidExpert_Blazor.ApiService.Application.Services;

public class AuthApplicationService : IAuthApplicationService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IConfiguration _configuration;

    public AuthApplicationService(IUserRepository userRepository, IRoleRepository roleRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _configuration = configuration;
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginCommand command)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(command.Email);
            if (user == null || user.PasswordHash == null)
            {
                return Result<AuthResponse>.Failure("Invalid credentials.");
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(command.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return Result<AuthResponse>.Failure("Invalid credentials.");
            }

            var token = GenerateJwtToken(user);
            var userDto = new UserProfileDataDto { Uid = user.Uid, Email = user.Email, FullName = user.FullName, RoleId = user.RoleId, Permissions = user.Permissions.ToList() };

            return Result<AuthResponse>.Success(new AuthResponse(token, userDto));
        }
        catch (Exception ex)
        {
            return Result<AuthResponse>.Failure($"Login failed: {ex.Message}");
        }
    }

    public async Task<Result<UserProfileDataDto>> RegisterAsync(RegisterUserCommand command)
    {
        try
        {
            var existingUser = await _userRepository.GetByEmailAsync(command.Email);
            if (existingUser != null)
            {
                return Result<UserProfileDataDto>.Failure("A user with this email already exists.");
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(command.Password);
            string uid = Guid.NewGuid().ToString();

            var newUser = new User(uid, command.Email, command.FullName, command.RoleId, new List<string>());
            newUser.SetPasswordHash(hashedPassword);

            await _userRepository.AddAsync(newUser, hashedPassword);

            var userDto = new UserProfileDataDto { Uid = newUser.Uid, Email = newUser.Email, FullName = newUser.FullName };
            return Result<UserProfileDataDto>.Success(userDto, "User registered successfully.");
        }
        catch (Exception ex)
        {
            return Result<UserProfileDataDto>.Failure($"Registration failed: {ex.Message}");
        }
    }

    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured."));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Uid),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        if (!string.IsNullOrEmpty(user.FullName))
        {
            claims.Add(new Claim(ClaimTypes.Name, user.FullName));
        }

        if (user.Permissions != null)
        {
            foreach (var permission in user.Permissions)
            {
                claims.Add(new Claim("permission", permission));
            }
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
