// src/types/lawyer-dashboard.ts
/**
 * @fileoverview Tipos TypeScript específicos para o painel do advogado.
 * Estruturas derivadas do banco de dados são convertidas para tipos simples
 * e serializáveis, adequados para renderização em componentes React.
 */

export type LawyerCaseRole = 'ADVOGADO_AUTOR' | 'ADVOGADO_REU';
export type LawyerCaseStatus = 'EM_ANDAMENTO' | 'EM_PREPARACAO' | 'CONCLUIDO';
export type LawyerTaskStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
export type LawyerTaskPriority = 'ALTA' | 'MEDIA' | 'BAIXA';
export type LawyerHearingStatus = 'AGENDADA' | 'CONCLUIDA';

export interface LawyerCaseSummary {
  id: string;
  processNumber: string;
  courtName?: string | null;
  branchName?: string | null;
  sellerName?: string | null;
  role: LawyerCaseRole;
  status: LawyerCaseStatus;
  lotsCount: number;
  assetsCount: number;
  estimatedValue: number;
  nextEventDate?: Date | null;
  nextEventLabel?: string | null;
  updatedAt: Date | null;
}

export interface LawyerTaskSummary {
  id: string;
  title: string;
  dueDate: Date;
  status: LawyerTaskStatus;
  priority: LawyerTaskPriority;
  relatedProcessId?: string;
  relatedProcessNumber?: string;
}

export type LawyerDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';

export interface LawyerDocumentSummary {
  id: string;
  type: string;
  status: LawyerDocumentStatus;
  updatedAt: Date | null;
  fileName?: string | null;
}

export interface LawyerHearingSummary {
  id: string;
  processId: string;
  processNumber: string;
  title: string;
  date: Date;
  location?: string | null;
  status: LawyerHearingStatus;
}

export interface LawyerMonetizationInfo {
  model: 'SUBSCRIPTION' | 'PAY_PER_USE' | 'REVENUE_SHARE';
  label: string;
  description: string;
  amountLabel?: string;
  nextBillingDate?: Date | null;
}

export interface LawyerDashboardMetrics {
  activeCases: number;
  hearingsThisWeek: number;
  documentsPending: number;
  totalPortfolioValue: number;
}

export interface LawyerDashboardOverview {
  metrics: LawyerDashboardMetrics;
  monetization: LawyerMonetizationInfo;
  cases: LawyerCaseSummary[];
  tasks: LawyerTaskSummary[];
  documents: LawyerDocumentSummary[];
  upcomingHearings: LawyerHearingSummary[];
}
