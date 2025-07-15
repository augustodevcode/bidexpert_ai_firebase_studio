using BidExpert_Blazor.ServiceDefaults.Dtos;
using BidExpert_Blazor.ApiService.Application.Results;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BidExpert_Blazor.ApiService.Application.Interfaces;

public interface ICatalogApplicationService {
    Task<Result<List<LotCategoryDto>>> GetAllLotCategoriesAsync();
    Task<Result<List<SubcategoryDto>>> GetSubcategoriesAsync(string parentCategoryId);
    Task<Result<List<StateInfoDto>>> GetAllStatesAsync();
    Task<Result<List<CityInfoDto>>> GetCitiesByStateAsync(string stateUfOrId);
}
