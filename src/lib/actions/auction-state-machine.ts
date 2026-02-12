/**
 * @fileoverview Server Actions para a Máquina de Estado de Leilões.
 * Expõe operações de transição de estado como server actions do Next.js,
 * com autenticação e validação.
 */

'use server';

import {
  auctionStateMachine,
  lotStateMachine,
  type TransitionResult,
  type LotTransitionResult,
} from '@/lib/auction-state-machine';

// ============================================================================
// AÇÕES DE TRANSIÇÃO DO LEILÃO
// ============================================================================

/**
 * Submeter leilão para validação (DRAFT → PENDING_VALIDATION).
 */
export async function submitAuctionForValidation(
  auctionId: string,
  userId: string,
  tenantId: string
): Promise<TransitionResult> {
  return auctionStateMachine.submitForValidation({
    auctionId,
    userId,
    tenantId,
  });
}

/**
 * Aprovar leilão (PENDING_VALIDATION → SCHEDULED).
 */
export async function approveAuction(
  auctionId: string,
  validatorUserId: string,
  tenantId: string,
  openDate: Date,
  userPermissions: string[]
): Promise<TransitionResult> {
  return auctionStateMachine.approveAuction(
    {
      auctionId,
      validatorUserId,
      tenantId,
      openDate,
    },
    {
      id: BigInt(validatorUserId),
      permissions: userPermissions,
    }
  );
}

/**
 * Reprovar leilão (PENDING_VALIDATION → IN_REVIEW).
 */
export async function rejectAuction(
  auctionId: string,
  validatorUserId: string,
  tenantId: string,
  validationNotes: string,
  userPermissions: string[]
): Promise<TransitionResult> {
  return auctionStateMachine.rejectAuction(
    {
      auctionId,
      validatorUserId,
      tenantId,
      validationNotes,
    },
    {
      id: BigInt(validatorUserId),
      permissions: userPermissions,
    }
  );
}

/**
 * Retornar leilão para rascunho (IN_REVIEW → DRAFT).
 */
export async function returnAuctionToDraft(
  auctionId: string,
  userId: string,
  tenantId: string
): Promise<TransitionResult> {
  return auctionStateMachine.returnToDraft({
    auctionId,
    userId,
    tenantId,
  });
}

/**
 * Abrir leilão manualmente (SCHEDULED → OPEN).
 */
export async function openAuctionManually(
  auctionId: string,
  userId: string,
  tenantId: string
): Promise<TransitionResult> {
  return auctionStateMachine.openAuction({
    auctionId,
    userId,
    tenantId,
    isAutomatic: false,
  });
}

/**
 * Retornar leilão à validação (SCHEDULED → PENDING_VALIDATION).
 */
export async function returnAuctionToValidation(
  auctionId: string,
  userId: string,
  tenantId: string,
  userPermissions: string[]
): Promise<TransitionResult> {
  return auctionStateMachine.returnToValidation(
    {
      auctionId,
      userId,
      tenantId,
    },
    {
      id: BigInt(userId),
      permissions: userPermissions,
    }
  );
}

/**
 * Encerrar leilão (OPEN/IN_AUCTION → CLOSED).
 */
export async function closeAuction(
  auctionId: string,
  userId: string,
  tenantId: string,
  userPermissions: string[]
): Promise<TransitionResult> {
  return auctionStateMachine.closeAuction(
    {
      auctionId,
      userId,
      tenantId,
    },
    {
      id: BigInt(userId),
      permissions: userPermissions,
    }
  );
}

/**
 * Cancelar leilão (QUALQUER não-terminal → CANCELLED).
 */
export async function cancelAuction(
  auctionId: string,
  userId: string,
  tenantId: string,
  cancellationReason: string,
  userPermissions: string[]
): Promise<TransitionResult> {
  return auctionStateMachine.cancelAuction(
    {
      auctionId,
      userId,
      tenantId,
      cancellationReason,
    },
    {
      id: BigInt(userId),
      permissions: userPermissions,
    }
  );
}

// ============================================================================
// AÇÕES DE TRANSIÇÃO DO LOTE
// ============================================================================

/**
 * Iniciar pregão de um lote (OPEN → IN_AUCTION).
 */
export async function startLotAuction(
  lotId: string,
  auctionId: string,
  userId: string,
  tenantId: string
): Promise<LotTransitionResult> {
  return lotStateMachine.startLotAuction({
    lotId,
    auctionId,
    userId,
    tenantId,
  });
}

/**
 * Confirmar arrematação de um lote (IN_AUCTION → SOLD).
 */
export async function confirmLotSale(
  lotId: string,
  auctionId: string,
  userId: string,
  tenantId: string,
  winnerId: string,
  soldPrice: number
): Promise<LotTransitionResult> {
  return lotStateMachine.confirmSale({
    lotId,
    auctionId,
    userId,
    tenantId,
    winnerId,
    soldPrice,
  });
}

/**
 * Marcar lote como não arrematado (IN_AUCTION → UNSOLD).
 */
export async function markLotUnsold(
  lotId: string,
  auctionId: string,
  userId: string,
  tenantId: string
): Promise<LotTransitionResult> {
  return lotStateMachine.markUnsold({
    lotId,
    auctionId,
    userId,
    tenantId,
  });
}

/**
 * Fechar lote (SOLD/UNSOLD → CLOSED).
 */
export async function closeLot(
  lotId: string,
  auctionId: string,
  userId: string,
  tenantId: string
): Promise<LotTransitionResult> {
  return lotStateMachine.closeLot({
    lotId,
    auctionId,
    userId,
    tenantId,
  });
}

// ============================================================================
// AÇÃO DE CRON JOB
// ============================================================================

/**
 * Processar leilões agendados que devem ser abertos automaticamente.
 * Chamado pelo cron job.
 */
export async function processScheduledAuctions(
  tenantId?: string
): Promise<{ opened: number; errors: string[] }> {
  return auctionStateMachine.processScheduledAuctions(
    tenantId ? BigInt(tenantId) : undefined
  );
}
