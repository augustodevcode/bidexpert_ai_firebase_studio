/**
 * @fileoverview Mensagens de erro para a Máquina de Estado de Leilões.
 * Todas em português, claras e específicas. Cada mensagem corresponde a um
 * cenário de erro possível nas transições de estado.
 */

import { translateAuctionStatus, translateLotStatus } from './constants';

export const AuctionErrorMessages = {
  // ── Transições inválidas ──────────────────────────────────────────────
  INVALID_TRANSITION: (from: string, to: string) =>
    `Transição inválida: não é possível alterar de "${translateAuctionStatus(from)}" para "${translateAuctionStatus(to)}"`,

  INVALID_LOT_TRANSITION: (from: string, to: string) =>
    `Transição de lote inválida: não é possível alterar de "${translateLotStatus(from)}" para "${translateLotStatus(to)}"`,

  // ── Permissões ────────────────────────────────────────────────────────
  INSUFFICIENT_PERMISSIONS: 'Você não tem permissão para realizar esta operação',
  CANNOT_VALIDATE_OWN: 'Você não pode validar seu próprio leilão',
  NOT_CREATOR: 'Apenas o criador pode editar este leilão',
  MISSING_PERMISSION_FLAG: (flag: string) =>
    `Permissão requerida: ${flag}`,

  // ── Operações em estados incorretos ───────────────────────────────────
  CANNOT_DELETE: 'Apenas leilões em Rascunho podem ser deletados',
  CANNOT_EDIT: (status: string) =>
    `Leilões em "${translateAuctionStatus(status)}" não podem ser editados`,
  CANNOT_CANCEL_TERMINAL: 'Leilões encerrados ou cancelados não podem ser cancelados',
  CANNOT_MODIFY_TERMINAL: 'Leilões em estado final não podem ser modificados',

  // ── Validações de dados ───────────────────────────────────────────────
  MISSING_VALIDATION_NOTES: 'Observações são obrigatórias ao reprovar um leilão (mínimo 10 caracteres)',
  MISSING_CANCELLATION_REASON: 'Motivo do cancelamento é obrigatório (mínimo 10 caracteres)',
  FUTURE_DATE_REQUIRED: 'A data de abertura deve ser futura',
  LOTS_REQUIRED: 'É necessário pelo menos um lote para submeter o leilão',
  TITLE_REQUIRED: 'Título é obrigatório (mínimo 3 caracteres)',
  DESCRIPTION_REQUIRED: 'Descrição é obrigatória (mínimo 10 caracteres)',

  // ── Lotes ─────────────────────────────────────────────────────────────
  LOT_NOT_FOUND: 'Lote não encontrado',
  CANNOT_BID_CLOSED: 'Não é possível dar lances em lotes encerrados',
  CANNOT_ENTER_AUCTION: 'Não é possível entrar em pregão neste momento',
  LOTS_NOT_ALL_CLOSED: 'Nem todos os lotes estão encerrados ou cancelados',
  AT_LEAST_ONE_LOT_CLOSED: 'Pelo menos um lote deve estar encerrado (não apenas cancelados)',

  // ── Lances ────────────────────────────────────────────────────────────
  BID_TOO_LOW: 'Lance deve ser maior que o valor atual',
  AUCTION_NOT_OPEN: 'Leilão não está aberto para lances',
  LOT_NOT_OPEN_FOR_BIDS: 'Lote não está aberto para lances',

  // ── Genéricos ─────────────────────────────────────────────────────────
  NOT_FOUND: 'Leilão não encontrado',
  INTERNAL_ERROR: 'Erro interno do servidor',
  TRANSACTION_FAILED: 'Falha na transação, tente novamente',
} as const;

export type AuctionErrorMessageKey = keyof typeof AuctionErrorMessages;
