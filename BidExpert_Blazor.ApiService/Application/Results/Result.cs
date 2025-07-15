using System.Collections.Generic;
using System.Linq;

namespace BidExpert_Blazor.ApiService.Application.Results;

public class Result
{
    public bool Succeeded { get; protected set; }
    public string? Message { get; protected set; }
    public List<string> Errors { get; protected set; }

    protected Result(bool succeeded, string? message = null, List<string>? errors = null)
    {
        Succeeded = succeeded;
        Message = message;
        Errors = errors ?? new List<string>();
    }

    public static Result Success(string? successMessage = null) => new Result(true, successMessage);
    public static Result Failure(string errorMessage, List<string>? errors = null)
    {
        var errorList = errors ?? new List<string>();
        if (!string.IsNullOrEmpty(errorMessage) && !errorList.Contains(errorMessage))
        {
             errorList.Insert(0, errorMessage);
        }
        return new Result(false, errorMessage, errorList);
    }
    public static Result Failure(List<string> errors) => new Result(false, errors?.FirstOrDefault(), errors);
}

public class Result<T> : Result
{
    public T? Data { get; private set; }

    private Result(bool succeeded, T? data, string? message = null, List<string>? errors = null)
        : base(succeeded, message, errors)
    {
        Data = data;
    }

    public static Result<T> Success(T data, string? successMessage = null)
        => new Result<T>(true, data, successMessage);

    public new static Result<T> Failure(string errorMessage, List<string>? errors = null)
    {
        var errorList = errors ?? new List<string>();
        if (!string.IsNullOrEmpty(errorMessage) && !errorList.Contains(errorMessage))
        {
             errorList.Insert(0, errorMessage);
        }
        return new Result<T>(false, default(T), errorMessage, errorList);
    }
    public new static Result<T> Failure(List<string> errors)
        => new Result<T>(false, default(T), errors?.FirstOrDefault(), errors);
}
