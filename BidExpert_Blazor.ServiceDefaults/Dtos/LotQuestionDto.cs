using System;

namespace BidExpert_Blazor.ServiceDefaults.Dtos;

public record LotQuestionDto
{
    public string Id { get; init; } = string.Empty;
    public string LotId { get; init; } = string.Empty;
    public string AuctionId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string UserDisplayName { get; init; } = string.Empty;
    public string QuestionText { get; init; } = string.Empty;
    public DateTimeOffset? CreatedAt { get; init; }
    public string? AnswerText { get; init; }
    public DateTimeOffset? AnsweredAt { get; init; }
    public string? AnsweredByUserId { get; init; }
    public string? AnsweredByUserDisplayName { get; init; }
    public bool? IsPublic { get; init; }
}
