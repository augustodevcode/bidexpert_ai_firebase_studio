/**
 * @fileoverview Barrel export para a Máquina de Estado de Leilões.
 * Importar tudo daqui para uso em server actions e API routes.
 */

// Constantes, enums tipados e helpers
export {
  AuctionStatus,
  LotStatus,
  BidStatus,
  UserPermissionFlag,
  AUCTION_TRANSITIONS,
  LOT_TRANSITIONS,
  TERMINAL_AUCTION_STATUSES,
  TERMINAL_LOT_STATUSES,
  PUBLIC_AUCTION_STATUSES,
  NON_PUBLIC_AUCTION_STATUSES,
  AUCTION_STATUS_LABELS,
  LOT_STATUS_LABELS,
  BID_STATUS_LABELS,
  AUCTION_SITE_SECTION,
  AUCTION_TO_LOT_SYNC,
  isValidAuctionTransition,
  isValidLotTransition,
  translateAuctionStatus,
  translateLotStatus,
  isPublicAuctionStatus,
  isTerminalAuctionStatus,
  isTerminalLotStatus,
  type AuctionStatusType,
  type LotStatusType,
  type BidStatusType,
  type UserPermissionFlagType,
} from './constants';

// Mensagens de erro
export { AuctionErrorMessages } from './error-messages';

// Schemas Zod
export {
  SubmitForValidationSchema,
  AuctionSubmissionDataSchema,
  ApproveAuctionSchema,
  RejectAuctionSchema,
  ReturnToDraftSchema,
  OpenAuctionSchema,
  ReturnToValidationSchema,
  CancelAuctionSchema,
  ForceCloseAuctionSchema,
  StartLotAuctionSchema,
  ConfirmLotSaleSchema,
  MarkLotUnsoldSchema,
  CloseLotSchema,
  PlaceBidSchema,
  type SubmitForValidationInput,
  type ApproveAuctionInput,
  type RejectAuctionInput,
  type ReturnToDraftInput,
  type OpenAuctionInput,
  type ReturnToValidationInput,
  type CancelAuctionInput,
  type ForceCloseAuctionInput,
  type StartLotAuctionInput,
  type ConfirmLotSaleInput,
  type MarkLotUnsoldInput,
  type CloseLotInput,
  type PlaceBidInput,
} from './schemas';

// Serviços
export {
  AuctionStateMachineService,
  auctionStateMachine,
  type TransitionResult,
} from './auction-state.service';

export {
  LotStateMachineService,
  lotStateMachine,
  type LotTransitionResult,
} from './lot-state.service';

// Audit Log
export {
  createStateAuditLog,
  type AuditEntityType,
  type AuditLogEntry,
} from './audit-log.service';
