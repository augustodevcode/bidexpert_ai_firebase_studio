using System;

namespace BidExpert_Blazor.ApiService.Domain.Entities;

public class LotQuestion
{
    public string Id { get; private set; }
    public string LotId { get; private set; }
    public string AuctionId { get; private set; }
    public string UserId { get; private set; }
    public string UserDisplayName { get; private set; }
    public string QuestionText { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public string? AnswerText { get; private set; }
    public DateTimeOffset? AnsweredAt { get; private set; }
    public string? AnsweredByUserId { get; private set; }
    public string? AnsweredByUserDisplayName { get; private set; }
    public bool IsPublic { get; private set; }
    public bool IsAnswered => !string.IsNullOrWhiteSpace(AnswerText);

    public LotQuestion(string id, string lotId, string auctionId, string userId, string userDisplayName, string questionText, bool isPublic = true)
    {
        Id = id; LotId = lotId; AuctionId = auctionId; UserId = userId;
        UserDisplayName = userDisplayName; QuestionText = questionText; IsPublic = isPublic;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public void AnswerQuestion(string answerText, string answeredByUserId, string answeredByUserDisplayName)
    {
        AnswerText = answerText; AnsweredByUserId = answeredByUserId;
        AnsweredByUserDisplayName = answeredByUserDisplayName; AnsweredAt = DateTimeOffset.UtcNow;
    }

    public void UpdateVisibility(bool isPublic) { IsPublic = isPublic; }
    public void UpdateQuestionText(string newQuestionText) { QuestionText = newQuestionText; }
}
