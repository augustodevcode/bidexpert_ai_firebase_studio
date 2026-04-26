/**
 * Garante que a auditoria Superbid -> BidExpert parte de fontes primarias auditaveis.
 */
import { describe, expect, it } from 'vitest';
import {
  SUPERBID_EDGE_CASES,
  SUPERBID_SOURCE_MATRIX,
  getPrimarySuperbidSources,
} from '../fixtures/superbid-source-matrix';

describe('Superbid source matrix', () => {
  it('contains exactly four primary modalities with more than five visible lots each', () => {
    const sources = getPrimarySuperbidSources();

    expect(sources).toHaveLength(4);
    expect(new Set(sources.map((source) => source.sourceModality))).toEqual(
      new Set(['judicial', 'corporate-auction', 'price-taking', 'market-counter']),
    );

    for (const source of sources) {
      expect(source.visibleLotCount, source.id).toBeGreaterThan(5);
      expect(source.sourceUrl, source.id).toMatch(/^https:\/\/(www|exchange)\.superbid\.net\/evento\//);
      expect(source.requiredComparisonFields.length, source.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('maps every primary source to a BidExpert target modality', () => {
    expect(SUPERBID_SOURCE_MATRIX.map((source) => source.bidExpertTargetModality)).toEqual([
      'JUDICIAL',
      'EXTRAJUDICIAL',
      'TOMADA_DE_PRECOS',
      'VENDA_DIRETA',
    ]);
  });

  it('keeps grouped-offer pages out of the primary source set', () => {
    const primaryUrls = new Set(SUPERBID_SOURCE_MATRIX.map((source) => source.sourceUrl));

    for (const edgeCase of SUPERBID_EDGE_CASES) {
      expect(primaryUrls.has(edgeCase.sourceUrl)).toBe(false);
      expect(edgeCase.reason).toContain('1 anuncio visivel');
    }
  });
});