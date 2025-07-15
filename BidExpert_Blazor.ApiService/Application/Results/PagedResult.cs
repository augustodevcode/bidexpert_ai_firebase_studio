using System.Collections.Generic;
using System.Linq;

namespace BidExpert_Blazor.ApiService.Application.Results;

public class PagedResult<T> : Result<List<T>>
{
    public int PageNumber { get; private set; }
    public int PageSize { get; private set; }
    public int TotalPages { get; private set; }
    public int TotalCount { get; private set; }

    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    private PagedResult(bool succeeded, List<T>? data, int pageNumber, int pageSize, int totalCount, string? message = null, List<string>? errors = null)
        : base(succeeded, data ?? new List<T>(), message, errors)
    {
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalCount = totalCount;
        TotalPages = (pageSize > 0 && totalCount > 0) ? (int)System.Math.Ceiling(totalCount / (double)pageSize) : 0;
    }

    public static PagedResult<T> Success(List<T> data, int pageNumber, int pageSize, int totalCount, string? message = null)
        => new PagedResult<T>(true, data, pageNumber, pageSize, totalCount, message);

    public new static PagedResult<T> Failure(string errorMessage, List<string>? errors = null)
    {
        var errorList = errors ?? new List<string>();
        if (!string.IsNullOrEmpty(errorMessage) && !errorList.Contains(errorMessage))
        {
             errorList.Insert(0, errorMessage);
        }
        return new PagedResult<T>(false, new List<T>(), 0, 0, 0, errorMessage, errorList);
    }

    public new static PagedResult<T> Failure(List<string> errors)
        => new PagedResult<T>(false, new List<T>(), 0, 0, 0, errors?.FirstOrDefault(), errors);
}
