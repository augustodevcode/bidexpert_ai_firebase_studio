using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;
namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
public interface IUserRepository {
    Task<User?> GetByUidAsync(string uid);
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetAllAsync();
    Task AddAsync(User user, string? plainTextPassword);
    Task UpdateAsync(User user);
    Task DeleteAsync(string uid);
}
