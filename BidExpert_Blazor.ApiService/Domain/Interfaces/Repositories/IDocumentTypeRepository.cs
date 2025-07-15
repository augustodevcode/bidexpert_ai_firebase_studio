using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface IDocumentTypeRepository
{
    Task<DocumentType?> GetByIdAsync(string id);
    Task<List<DocumentType>> GetAllAsync();
    Task AddAsync(DocumentType documentType);
    Task UpdateAsync(DocumentType documentType);
    Task DeleteAsync(string id);
}
