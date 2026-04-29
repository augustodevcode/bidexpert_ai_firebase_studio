/**
 * @fileoverview Testes unitários das regras puras de elegibilidade de lances.
 */

import { describe, expect, it } from 'vitest';

import { getBidEligibilityState } from '@/lib/bidding-eligibility';

describe('getBidEligibilityState', () => {
  it('bloqueia usuários sem login', () => {
    const state = getBidEligibilityState({ isAuthenticated: false });

    expect(state.canBid).toBe(false);
    expect(state.reason).toBe('LOGIN_REQUIRED');
  });

  it('permite auto-habilitação quando a documentação está aprovada mas falta habilitação no leilão', () => {
    const state = getBidEligibilityState({
      isAuthenticated: true,
      lotStatus: 'ABERTO_PARA_LANCES',
      auctionStatus: 'ABERTO_PARA_LANCES',
      userHabilitationStatus: 'HABILITADO',
      isAuctionHabilitated: false,
    });

    expect(state.canBid).toBe(false);
    expect(state.canSelfHabilitateForAuction).toBe(true);
    expect(state.reason).toBe('AUCTION_HABILITATION_REQUIRED');
  });

  it('bloqueia quando a documentação está pendente', () => {
    const state = getBidEligibilityState({
      isAuthenticated: true,
      lotStatus: 'ABERTO_PARA_LANCES',
      auctionStatus: 'ABERTO_PARA_LANCES',
      userHabilitationStatus: 'PENDING_ANALYSIS',
      isAuctionHabilitated: false,
    });

    expect(state.canBid).toBe(false);
    expect(state.canSelfHabilitateForAuction).toBe(false);
    expect(state.reason).toBe('DOCUMENTATION_PENDING');
  });

  it('libera usuários com bypass privilegiado', () => {
    const state = getBidEligibilityState({
      isAuthenticated: true,
      lotStatus: 'ABERTO_PARA_LANCES',
      auctionStatus: 'ABERTO_PARA_LANCES',
      userHabilitationStatus: 'PENDING_DOCUMENTS',
      isAuctionHabilitated: false,
      isPrivilegedBypass: true,
    });

    expect(state.canBid).toBe(true);
    expect(state.canPlaceMaxBid).toBe(true);
    expect(state.reason).toBe('ALLOWED');
  });

  it('libera comprador habilitado durante o pregão ao vivo', () => {
    const state = getBidEligibilityState({
      isAuthenticated: true,
      lotStatus: 'EM_PREGAO',
      auctionStatus: 'EM_PREGAO',
      userHabilitationStatus: 'HABILITADO',
      isAuctionHabilitated: true,
    });

    expect(state.canBid).toBe(true);
    expect(state.canPlaceMaxBid).toBe(true);
    expect(state.reason).toBe('ALLOWED');
  });

  it('bloqueia lances quando o lote não está aberto', () => {
    const state = getBidEligibilityState({
      isAuthenticated: true,
      lotStatus: 'ENCERRADO',
      auctionStatus: 'ABERTO_PARA_LANCES',
      userHabilitationStatus: 'HABILITADO',
      isAuctionHabilitated: true,
    });

    expect(state.canBid).toBe(false);
    expect(state.reason).toBe('LOT_NOT_OPEN');
  });
});