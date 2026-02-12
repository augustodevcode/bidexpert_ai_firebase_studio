/**
 * @fileoverview Constantes da Máquina de Estado de Leilões.
 * Define enums tipados, matrizes de transição válidas, permissões e
 * mapeamento de visibilidade pública. Referência central para toda lógica
 * de estado do sistema de leilões.
 */

// ============================================================================
// ENUMS TIPADOS (mapeiam 1:1 para os enums do Prisma)
// ============================================================================

export const AuctionStatus = {
  DRAFT: 'RASCUNHO',
  PENDING_VALIDATION: 'EM_VALIDACAO',
  IN_REVIEW: 'EM_AJUSTE',
  SCHEDULED: 'EM_BREVE',
  OPEN: 'ABERTO_PARA_LANCES',
  IN_AUCTION: 'EM_PREGAO',
  CLOSED: 'ENCERRADO',
  CANCELLED: 'CANCELADO',
} as const;

export type AuctionStatusType = typeof AuctionStatus[keyof typeof AuctionStatus];

export const LotStatus = {
  PENDING: 'AGUARDANDO',
  OPEN: 'ABERTO_PARA_LANCES',
  IN_AUCTION: 'EM_PREGAO',
  SOLD: 'VENDIDO',
  UNSOLD: 'NAO_VENDIDO',
  CLOSED: 'ENCERRADO',
  CANCELLED: 'CANCELADO',
} as const;

export type LotStatusType = typeof LotStatus[keyof typeof LotStatus];

export const BidStatus = {
  ACTIVE: 'ATIVO',
  CANCELLED: 'CANCELADO',
  WINNING: 'VENCEDOR',
  EXPIRED: 'EXPIRADO',
} as const;

export type BidStatusType = typeof BidStatus[keyof typeof BidStatus];

// ============================================================================
// FLAGS DE PERMISSÃO
// ============================================================================

export const UserPermissionFlag = {
  CAN_CREATE_AUCTION: 'CAN_CREATE_AUCTION',
  CAN_VALIDATE_AUCTION: 'CAN_VALIDATE_AUCTION',
  CAN_VALIDATE_OWN_AUCTION: 'CAN_VALIDATE_OWN_AUCTION',
  CAN_RETURN_TO_VALIDATION: 'CAN_RETURN_TO_VALIDATION',
  CAN_CANCEL_OR_CLOSE: 'CAN_CANCEL_OR_CLOSE',
} as const;

export type UserPermissionFlagType = typeof UserPermissionFlag[keyof typeof UserPermissionFlag];

// ============================================================================
// MATRIZ DE TRANSIÇÃO DE ESTADOS DO LEILÃO
// ============================================================================

export const AUCTION_TRANSITIONS: Record<AuctionStatusType, AuctionStatusType[]> = {
  [AuctionStatus.DRAFT]: [
    AuctionStatus.PENDING_VALIDATION,
  ],
  [AuctionStatus.PENDING_VALIDATION]: [
    AuctionStatus.SCHEDULED,   // Aprovado
    AuctionStatus.IN_REVIEW,   // Reprovado
  ],
  [AuctionStatus.IN_REVIEW]: [
    AuctionStatus.DRAFT,       // Retorno ao criador
  ],
  [AuctionStatus.SCHEDULED]: [
    AuctionStatus.OPEN,              // Automático quando openDate <= now()
    AuctionStatus.PENDING_VALIDATION, // Com flag CAN_RETURN_TO_VALIDATION
    AuctionStatus.CANCELLED,          // Com flag CAN_CANCEL_OR_CLOSE
  ],
  [AuctionStatus.OPEN]: [
    AuctionStatus.IN_AUCTION,  // Quando lote entra em pregão
    AuctionStatus.CLOSED,      // Quando todos lotes encerrados
    AuctionStatus.CANCELLED,   // Com flag CAN_CANCEL_OR_CLOSE
  ],
  [AuctionStatus.IN_AUCTION]: [
    AuctionStatus.OPEN,       // Quando nenhum lote mais em pregão
    AuctionStatus.CLOSED,     // Quando todos lotes encerrados
    AuctionStatus.CANCELLED,  // Com flag CAN_CANCEL_OR_CLOSE
  ],
  [AuctionStatus.CLOSED]: [],     // Estado Terminal
  [AuctionStatus.CANCELLED]: [],  // Estado Terminal
};

// ============================================================================
// MATRIZ DE TRANSIÇÃO DE ESTADOS DO LOTE
// ============================================================================

export const LOT_TRANSITIONS: Record<LotStatusType, LotStatusType[]> = {
  [LotStatus.PENDING]: [
    LotStatus.OPEN,       // Leilão vai para OPEN
    LotStatus.CANCELLED,  // Leilão cancelado
  ],
  [LotStatus.OPEN]: [
    LotStatus.IN_AUCTION,  // Leiloeiro inicia sessão
    LotStatus.UNSOLD,      // Leilão encerra sem pregão
    LotStatus.CANCELLED,   // Leilão cancelado
  ],
  [LotStatus.IN_AUCTION]: [
    LotStatus.SOLD,       // Lance vencedor confirmado
    LotStatus.UNSOLD,     // Tempo esgotado, sem lance
    LotStatus.CANCELLED,  // Leilão cancelado
  ],
  [LotStatus.SOLD]: [
    LotStatus.CLOSED,     // Processo de arrematação finalizado
  ],
  [LotStatus.UNSOLD]: [
    LotStatus.CLOSED,     // Processo de encerramento finalizado
  ],
  [LotStatus.CLOSED]: [],     // Estado Terminal
  [LotStatus.CANCELLED]: [],  // Estado Terminal
};

// ============================================================================
// ESTADOS TERMINAIS
// ============================================================================

export const TERMINAL_AUCTION_STATUSES: AuctionStatusType[] = [
  AuctionStatus.CLOSED,
  AuctionStatus.CANCELLED,
];

export const TERMINAL_LOT_STATUSES: LotStatusType[] = [
  LotStatus.CLOSED,
  LotStatus.CANCELLED,
];

// ============================================================================
// VISIBILIDADE PÚBLICA
// ============================================================================

export const PUBLIC_AUCTION_STATUSES: AuctionStatusType[] = [
  AuctionStatus.SCHEDULED,
  AuctionStatus.OPEN,
  AuctionStatus.IN_AUCTION,
  AuctionStatus.CLOSED,
];

export const NON_PUBLIC_AUCTION_STATUSES: AuctionStatusType[] = [
  AuctionStatus.DRAFT,
  AuctionStatus.PENDING_VALIDATION,
  AuctionStatus.IN_REVIEW,
  AuctionStatus.CANCELLED,
];

// ============================================================================
// MAPEAMENTO - Status Brasileiro / Label para UI
// ============================================================================

export const AUCTION_STATUS_LABELS: Record<AuctionStatusType, string> = {
  [AuctionStatus.DRAFT]: 'Rascunho',
  [AuctionStatus.PENDING_VALIDATION]: 'Em Validação',
  [AuctionStatus.IN_REVIEW]: 'Em Ajuste',
  [AuctionStatus.SCHEDULED]: 'Agendado',
  [AuctionStatus.OPEN]: 'Aberto para Lances',
  [AuctionStatus.IN_AUCTION]: 'Em Pregão',
  [AuctionStatus.CLOSED]: 'Encerrado',
  [AuctionStatus.CANCELLED]: 'Cancelado',
};

export const LOT_STATUS_LABELS: Record<LotStatusType, string> = {
  [LotStatus.PENDING]: 'Aguardando',
  [LotStatus.OPEN]: 'Aberto para Lances',
  [LotStatus.IN_AUCTION]: 'Em Pregão',
  [LotStatus.SOLD]: 'Arrematado',
  [LotStatus.UNSOLD]: 'Não Arrematado',
  [LotStatus.CLOSED]: 'Encerrado',
  [LotStatus.CANCELLED]: 'Cancelado',
};

export const BID_STATUS_LABELS: Record<BidStatusType, string> = {
  [BidStatus.ACTIVE]: 'Ativo',
  [BidStatus.CANCELLED]: 'Cancelado',
  [BidStatus.WINNING]: 'Vencedor',
  [BidStatus.EXPIRED]: 'Expirado',
};

// ============================================================================
// SEÇÕES DO SITE POR STATUS
// ============================================================================

export const AUCTION_SITE_SECTION: Record<AuctionStatusType, string> = {
  [AuctionStatus.DRAFT]: 'admin',
  [AuctionStatus.PENDING_VALIDATION]: 'admin',
  [AuctionStatus.IN_REVIEW]: 'admin',
  [AuctionStatus.SCHEDULED]: 'leiloes-em-breve',
  [AuctionStatus.OPEN]: 'leiloes-abertos',
  [AuctionStatus.IN_AUCTION]: 'leiloes-em-andamento',
  [AuctionStatus.CLOSED]: 'leiloes-encerrados',
  [AuctionStatus.CANCELLED]: 'admin-cancelados',
};

// ============================================================================
// SINCRONIZAÇÃO LEILÃO → LOTES (quando leilão muda, lotes devem seguir)
// ============================================================================

export const AUCTION_TO_LOT_SYNC: Partial<Record<AuctionStatusType, LotStatusType>> = {
  [AuctionStatus.OPEN]: LotStatus.OPEN,
  [AuctionStatus.CANCELLED]: LotStatus.CANCELLED,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica se uma transição de estado do leilão é válida.
 */
export function isValidAuctionTransition(from: AuctionStatusType, to: AuctionStatusType): boolean {
  const allowed = AUCTION_TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

/**
 * Verifica se uma transição de estado do lote é válida.
 */
export function isValidLotTransition(from: LotStatusType, to: LotStatusType): boolean {
  const allowed = LOT_TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

/**
 * Traduz status enum para label legível em português.
 */
export function translateAuctionStatus(status: string): string {
  return AUCTION_STATUS_LABELS[status as AuctionStatusType] || status;
}

/**
 * Traduz status do lote para label legível em português.
 */
export function translateLotStatus(status: string): string {
  return LOT_STATUS_LABELS[status as LotStatusType] || status;
}

/**
 * Verifica se o status do leilão é visível publicamente.
 */
export function isPublicAuctionStatus(status: AuctionStatusType): boolean {
  return PUBLIC_AUCTION_STATUSES.includes(status);
}

/**
 * Verifica se o status do leilão é terminal (não permite mais transições).
 */
export function isTerminalAuctionStatus(status: AuctionStatusType): boolean {
  return TERMINAL_AUCTION_STATUSES.includes(status);
}

/**
 * Verifica se o status do lote é terminal.
 */
export function isTerminalLotStatus(status: LotStatusType): boolean {
  return TERMINAL_LOT_STATUSES.includes(status);
}
