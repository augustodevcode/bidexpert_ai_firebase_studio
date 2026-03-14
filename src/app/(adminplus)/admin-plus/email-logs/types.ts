/**
 * @fileoverview Tipos compartilhados para a listagem de EmailLog no Admin Plus.
 */

export interface EmailLogRow {
  id: string;
  recipient: string;
  subject: string;
  provider: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage: string;
  content: string;
}

export interface EmailLogStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}