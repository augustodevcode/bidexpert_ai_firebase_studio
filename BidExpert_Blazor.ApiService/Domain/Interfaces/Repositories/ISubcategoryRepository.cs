using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Entities;

namespace BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;

public interface ISubcategoryRepository
{
    Task<Subcategory?> GetByIdAsync(string id);
    Task<List<Subcategory>> GetByParentCategoryIdAsync(string parentCategoryId);
    Task<Subcategory?> GetBySlugAsync(string slug, string parentCategoryId);
    Task AddAsync(Subcategory subcategory);
    Task UpdateAsync(Subcategory subcategory);
    Task DeleteAsync(string id);
}
