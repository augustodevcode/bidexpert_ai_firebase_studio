using System.Collections.Generic;
using System.Threading.Tasks;
using BidExpert_Blazor.ServiceDefaults.Dtos;

namespace BidExpert_Blazor.Web.Services.HttpClients.Interfaces;

public interface ICatalogClientApiService {
    Task<List<LotCategoryDto>?> GetLotCategoriesAsync();
    Task<List<SubcategoryDto>?> GetSubcategoriesAsync(string parentCategoryId);
}
