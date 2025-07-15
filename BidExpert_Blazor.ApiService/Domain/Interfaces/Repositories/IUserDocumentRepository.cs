using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IUserDocumentRepository
{
    Task<UserDocument?> GetByIdAsync(string id);
    Task<List<UserDocument>> GetByUserIdAsync(string userId);
    Task AddAsync(UserDocument userDocument);
    Task UpdateAsync(UserDocument userDocument);
    Task DeleteAsync(string id);
}
