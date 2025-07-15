using System;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class AuctionStage {
    public string Name { get; private set; }
    public DateTimeOffset EndDate { get; private set; }
    public string? StatusText { get; private set; }
    public decimal? InitialPrice { get; private set; }
    public AuctionStage(string name, DateTimeOffset endDate, decimal? initialPrice, string? statusText) {
        Name = name; EndDate = endDate; InitialPrice = initialPrice; StatusText = statusText;
    }
}
