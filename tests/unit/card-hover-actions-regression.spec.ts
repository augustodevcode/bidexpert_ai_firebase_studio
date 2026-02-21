/**
 * @fileoverview Regressão: garante que os cards mantenham a classe `group` para ativar overlays de hover.
 */

import { describe, expect, it } from 'vitest';
import lotCardSource from '../../src/components/cards/lot-card.tsx?raw';
import auctionCardSource from '../../src/components/cards/auction-card.tsx?raw';

describe('Card hover actions regression', () => {
  it('mantém classe group no card de lote', () => {
    expect(lotCardSource).toContain('className="card-lot group"');
    expect(lotCardSource).toContain('data-ai-id="lot-card-actions-overlay"');
    expect(lotCardSource).toContain('data-ai-id="lot-card-preview-btn"');
    expect(lotCardSource).toContain('data-ai-id="lot-card-favorite-btn"');
  });

  it('mantém classe group no card de leilão', () => {
    expect(auctionCardSource).toContain('className="card-auction group"');
    expect(auctionCardSource).toContain('data-ai-id="auction-card-actions-overlay"');
    expect(auctionCardSource).toContain('data-ai-id="auction-card-preview-btn"');
    expect(auctionCardSource).toContain('data-ai-id="auction-card-favorite-btn"');
  });
});
