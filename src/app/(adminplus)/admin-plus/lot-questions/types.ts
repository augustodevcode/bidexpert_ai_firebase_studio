/**
 * Type definitions for LotQuestion entity rows.
 */
export interface LotQuestionRow {
  id: string;
  lotId: string;
  lotTitle: string;
  auctionId: string;
  auctionTitle: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  questionText: string;
  answerText: string | null;
  isPublic: boolean;
  answeredAt: string | null;
  answeredByUserId: string | null;
  answeredByUserDisplayName: string | null;
  createdAt: string;
}
