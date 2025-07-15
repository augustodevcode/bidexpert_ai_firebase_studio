using System;
using System.Collections.Generic;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public record MediaItemDimensions
{
    public int Width { get; init; }
    public int Height { get; init; }

    public MediaItemDimensions(int width, int height)
    {
        Width = width; Height = height;
    }
}

public class MediaItem
{
    public string Id { get; private set; }
    public string FileName { get; private set; }
    public string MimeType { get; private set; }
    public long SizeBytes { get; private set; }
    public MediaItemDimensions? Dimensions { get; private set; }

    public string UrlOriginal { get; private set; }
    public string? UrlThumbnail { get; private set; }
    public string? UrlMedium { get; private set; }
    public string? UrlLarge { get; private set; }

    public string? Title { get; private set; }
    public string? AltText { get; private set; }
    public string? Caption { get; private set; }
    public string? Description { get; private set; }
    public string? DataAiHint { get; private set; }

    public List<string> LinkedLotIds { get; private set; }
    public DateTimeOffset UploadedAt { get; private set; }
    public string? UploadedByUserId { get; private set; }

    public MediaItem(
        string id, string fileName, string mimeType, long sizeBytes, string urlOriginal,
        string? uploadedByUserId = null, MediaItemDimensions? dimensions = null, string? title = null,
        string? altText = null, string? caption = null, string? description = null, string? dataAiHint = null)
    {
        Id = id; FileName = fileName; MimeType = mimeType; SizeBytes = sizeBytes; UrlOriginal = urlOriginal;
        UploadedByUserId = uploadedByUserId; Dimensions = dimensions; Title = title; AltText = altText;
        Caption = caption; Description = description; DataAiHint = dataAiHint;
        UploadedAt = DateTimeOffset.UtcNow; LinkedLotIds = new List<string>();
    }

    public void UpdateMetadata(string? title, string? altText, string? caption, string? description, string? dataAiHint)
    {
        Title = title; AltText = altText; Caption = caption; Description = description; DataAiHint = dataAiHint;
    }

    public void SetProcessedImageUrls(string? urlThumbnail, string? urlMedium, string? urlLarge)
    {
        UrlThumbnail = urlThumbnail; UrlMedium = urlMedium; UrlLarge = urlLarge;
    }

    public void SetDimensions(int width, int height) { Dimensions = new MediaItemDimensions(width, height); }
    public void LinkToLot(string lotId) { if (!LinkedLotIds.Contains(lotId)) LinkedLotIds.Add(lotId); }
    public void UnlinkFromLot(string lotId) { LinkedLotIds.Remove(lotId); }
    public void UnlinkFromAllLots() { LinkedLotIds.Clear(); }
}
