/**
 * @fileoverview Regras puras de elegibilidade para participação em lances e auto-habilitação.
 */

import type { AuctionStatus, LotStatus, UserHabilitationStatus } from '@/types';

export type BidEligibilityReason =
  | 'ALLOWED'
  | 'LOGIN_REQUIRED'
  | 'LOT_NOT_OPEN'
  | 'AUCTION_NOT_ACTIVE'
  | 'DOCUMENTATION_PENDING'
  | 'AUCTION_HABILITATION_REQUIRED';

export interface BidEligibilityContext {
  isAuthenticated: boolean;
  lotStatus?: LotStatus | null;
  auctionStatus?: AuctionStatus | null;
  userHabilitationStatus?: UserHabilitationStatus | null;
  isAuctionHabilitated?: boolean;
  isPrivilegedBypass?: boolean;
}

export interface BidEligibilityState {
  canBid: boolean;
  canPlaceMaxBid: boolean;
  canSelfHabilitateForAuction: boolean;
  reason: BidEligibilityReason;
  title: string;
  description: string;
}

const ACTIVE_AUCTION_STATUSES = new Set<AuctionStatus>(['ABERTO', 'ABERTO_PARA_LANCES']);
const OPEN_LOT_STATUS: LotStatus = 'ABERTO_PARA_LANCES';

const getDocumentationCopy = (status?: UserHabilitationStatus | null) => {
  switch (status) {
    case 'PENDING_ANALYSIS':
      return {
        title: 'Documentação em análise',
        description: 'Sua documentação foi enviada e ainda está em análise. Você poderá dar lances após a aprovação.',
      };
    case 'REJECTED_DOCUMENTS':
      return {
        title: 'Documentação rejeitada',
        description: 'Há documentos pendentes de correção. Atualize sua documentação para voltar a participar.',
      };
    case 'BLOCKED':
      return {
        title: 'Cadastro bloqueado',
        description: 'Seu cadastro está bloqueado para participação em leilões. Entre em contato com o suporte.',
      };
    case 'PENDING_DOCUMENTS':
    default:
      return {
        title: 'Documentação pendente',
        description: 'Sua documentação precisa ser aprovada para dar lances neste leilão.',
      };
  }
};

export const getBidEligibilityState = ({
  isAuthenticated,
  lotStatus,
  auctionStatus,
  userHabilitationStatus,
  isAuctionHabilitated = false,
  isPrivilegedBypass = false,
}: BidEligibilityContext): BidEligibilityState => {
  if (!isAuthenticated) {
    return {
      canBid: false,
      canPlaceMaxBid: false,
      canSelfHabilitateForAuction: false,
      reason: 'LOGIN_REQUIRED',
      title: 'Login obrigatório',
      description: 'Faça login ou crie uma conta para participar deste leilão.',
    };
  }

  if (lotStatus && lotStatus !== OPEN_LOT_STATUS) {
    return {
      canBid: false,
      canPlaceMaxBid: false,
      canSelfHabilitateForAuction: false,
      reason: 'LOT_NOT_OPEN',
      title: 'Lote indisponível para lances',
      description: 'Este lote não está aberto para lances neste momento.',
    };
  }

  if (auctionStatus && !ACTIVE_AUCTION_STATUSES.has(auctionStatus)) {
    return {
      canBid: false,
      canPlaceMaxBid: false,
      canSelfHabilitateForAuction: false,
      reason: 'AUCTION_NOT_ACTIVE',
      title: 'Leilão indisponível',
      description: 'O leilão não está ativo para participação neste momento.',
    };
  }

  if (isPrivilegedBypass) {
    return {
      canBid: true,
      canPlaceMaxBid: true,
      canSelfHabilitateForAuction: false,
      reason: 'ALLOWED',
      title: 'Participação liberada',
      description: 'Usuário com permissão privilegiada para testes e administração.',
    };
  }

  if (userHabilitationStatus !== 'HABILITADO') {
    const copy = getDocumentationCopy(userHabilitationStatus);
    return {
      canBid: false,
      canPlaceMaxBid: false,
      canSelfHabilitateForAuction: false,
      reason: 'DOCUMENTATION_PENDING',
      ...copy,
    };
  }

  if (!isAuctionHabilitated) {
    return {
      canBid: false,
      canPlaceMaxBid: false,
      canSelfHabilitateForAuction: true,
      reason: 'AUCTION_HABILITATION_REQUIRED',
      title: 'Habilite-se para participar',
      description: 'Sua documentação está aprovada. Falta apenas a habilitação específica para este leilão.',
    };
  }

  return {
    canBid: true,
    canPlaceMaxBid: true,
    canSelfHabilitateForAuction: false,
    reason: 'ALLOWED',
    title: 'Participação liberada',
    description: 'Você pode dar lances e configurar lance automático.',
  };
};