namespace BidExpert_Blazor.ApiService.Application.Commands.Auctions;

public record PlaceBidCommand(string LotId, string AuctionId, string UserId, string UserDisplayName, decimal Amount);
