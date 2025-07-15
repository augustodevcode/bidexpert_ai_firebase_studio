using System;
using System.Collections.Generic;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record MediaItemDimensionsDto
{
    public int Width { get; init; }
    public int Height { get; init; }
}

public record MediaItemDto
{
    public string Id { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public DateTimeOffset? UploadedAt { get; init; }
    public string? UploadedBy { get; init; }
    public string? Title { get; init; }
    public string? AltText { get; init; }
    public string? Caption { get; init; }
    public string? Description { get; init; }
    public string MimeType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public MediaItemDimensionsDto? Dimensions { get; init; }
    public string UrlOriginal { get; init; } = string.Empty;
    public string? UrlThumbnail { get; init; }
    public string? UrlMedium { get; init; }
    public string? UrlLarge { get; init; }
    public List<string>? LinkedLotIds { get; init; }
    public string? DataAiHint { get; init; }
}
