using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IRoleRepository {
    Task<Role?> GetByIdAsync(string id);
    Task<Role?> GetByNameAsync(string normalizedName);
    Task<List<Role>> GetAllAsync();
    Task AddAsync(Role role);
    Task UpdateAsync(Role role);
    Task DeleteAsync(string id);
    Task EnsureDefaultRolesExistAsync(IEnumerable<Role> defaultRoles);
}
