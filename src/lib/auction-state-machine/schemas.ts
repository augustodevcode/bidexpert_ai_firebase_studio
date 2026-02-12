/**
 * @fileoverview Schemas Zod para validação de todas as transições da
 * Máquina de Estado de Leilões. Cada transição possui seu próprio schema
 * com validações específicas.
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE TRANSIÇÃO DO LEILÃO
// ============================================================================

/**
 * DRAFT → PENDING_VALIDATION
 * Submeter leilão para validação.
 */
export const SubmitForValidationSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
});

/**
 * Dados mínimos exigidos do leilão para submissão.
 */
export const AuctionSubmissionDataSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório (mínimo 3 caracteres)'),
  description: z.string().min(10, 'Descrição é obrigatória (mínimo 10 caracteres)').nullable().optional()
    .refine(val => val !== null && val !== undefined && val.length >= 10, {
      message: 'Descrição é obrigatória (mínimo 10 caracteres)',
    }),
  lotsCount: z.number().min(1, 'É necessário pelo menos um lote para submeter o leilão'),
});

/**
 * PENDING_VALIDATION → SCHEDULED (Aprovação)
 * Aprovar leilão e definir data de abertura.
 */
export const ApproveAuctionSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  validatorUserId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
  openDate: z.coerce.date().refine(
    (date) => date > new Date(),
    { message: 'A data de abertura deve ser futura' }
  ),
});

/**
 * PENDING_VALIDATION → IN_REVIEW (Reprovação)
 * Reprovar leilão com observações obrigatórias.
 */
export const RejectAuctionSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  validatorUserId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
  validationNotes: z.string().min(10, 'Observações são obrigatórias ao reprovar (mínimo 10 caracteres)'),
});

/**
 * IN_REVIEW → DRAFT (Retorno ao criador)
 */
export const ReturnToDraftSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
});

/**
 * SCHEDULED → OPEN (Abertura automática ou manual)
 */
export const OpenAuctionSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]).optional(), // Opcional para jobs automáticos
  isAutomatic: z.boolean().default(false),
});

/**
 * SCHEDULED → PENDING_VALIDATION (Retorno à validação)
 */
export const ReturnToValidationSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
});

/**
 * QUALQUER → CANCELLED (Cancelamento)
 */
export const CancelAuctionSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
  cancellationReason: z.string().min(10, 'Motivo do cancelamento é obrigatório (mínimo 10 caracteres)'),
});

/**
 * Forçar encerramento (OPEN/IN_AUCTION → CLOSED)
 */
export const ForceCloseAuctionSchema = z.object({
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
});

// ============================================================================
// SCHEMAS DE TRANSIÇÃO DO LOTE
// ============================================================================

/**
 * Iniciar pregão de um lote (OPEN → IN_AUCTION)
 */
export const StartLotAuctionSchema = z.object({
  lotId: z.union([z.string(), z.bigint()]),
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
});

/**
 * Confirmar arrematação (IN_AUCTION → SOLD)
 */
export const ConfirmLotSaleSchema = z.object({
  lotId: z.union([z.string(), z.bigint()]),
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
  winnerId: z.union([z.string(), z.bigint()]),
  soldPrice: z.number().positive('Preço de venda deve ser positivo'),
});

/**
 * Marcar lote como não arrematado (IN_AUCTION → UNSOLD)
 */
export const MarkLotUnsoldSchema = z.object({
  lotId: z.union([z.string(), z.bigint()]),
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
});

/**
 * Finalizar processo do lote (SOLD/UNSOLD → CLOSED)
 */
export const CloseLotSchema = z.object({
  lotId: z.union([z.string(), z.bigint()]),
  auctionId: z.union([z.string(), z.bigint()]),
  userId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
});

// ============================================================================
// SCHEMAS DE LANCES
// ============================================================================

/**
 * Criar lance em um lote aberto – validações gerais.
 */
export const PlaceBidSchema = z.object({
  lotId: z.union([z.string(), z.bigint()]),
  auctionId: z.union([z.string(), z.bigint()]),
  bidderId: z.union([z.string(), z.bigint()]),
  tenantId: z.union([z.string(), z.bigint()]),
  amount: z.number().positive('Valor do lance deve ser positivo')
    .max(999999999, 'Valor excede o limite máximo'),
  isAutoBid: z.boolean().default(false),
});

// ============================================================================
// TIPOS INFERIDOS
// ============================================================================

export type SubmitForValidationInput = z.infer<typeof SubmitForValidationSchema>;
export type ApproveAuctionInput = z.infer<typeof ApproveAuctionSchema>;
export type RejectAuctionInput = z.infer<typeof RejectAuctionSchema>;
export type ReturnToDraftInput = z.infer<typeof ReturnToDraftSchema>;
export type OpenAuctionInput = z.infer<typeof OpenAuctionSchema>;
export type ReturnToValidationInput = z.infer<typeof ReturnToValidationSchema>;
export type CancelAuctionInput = z.infer<typeof CancelAuctionSchema>;
export type ForceCloseAuctionInput = z.infer<typeof ForceCloseAuctionSchema>;
export type StartLotAuctionInput = z.infer<typeof StartLotAuctionSchema>;
export type ConfirmLotSaleInput = z.infer<typeof ConfirmLotSaleSchema>;
export type MarkLotUnsoldInput = z.infer<typeof MarkLotUnsoldSchema>;
export type CloseLotInput = z.infer<typeof CloseLotSchema>;
export type PlaceBidInput = z.infer<typeof PlaceBidSchema>;
