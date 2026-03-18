/**
 * @fileoverview Garante que o CTA de novo lote preserve o contexto da listagem.
 */

import { describe, expect, it } from 'vitest';
import { buildNewLotHref } from '@/app/admin/lots/new-lot-link';

describe('buildNewLotHref', () => {
  it('returns the base new lot path without filters', () => {
    expect(buildNewLotHref({})).toBe('/admin/lots/new');
  });

  it('preserves auction filter in the new lot CTA', () => {
    expect(buildNewLotHref({ auctionId: 'auction-123' })).toBe('/admin/lots/new?auctionId=auction-123');
  });

  it('preserves multiple filters when present', () => {
    expect(buildNewLotHref({ auctionId: 'auction-123', judicialProcessId: 'process-9' })).toBe(
      '/admin/lots/new?auctionId=auction-123&judicialProcessId=process-9'
    );
  });
});