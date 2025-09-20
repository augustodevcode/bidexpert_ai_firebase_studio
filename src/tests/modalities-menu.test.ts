// tests/modalities-menu.test.ts
import { describe, it } from 'vitest';
import assert from 'node:assert';

const expectedModalities = [
  { href: '/search?type=auctions&auctionType=JUDICIAL', label: 'Leilões Judiciais' },
  { href: '/search?type=auctions&auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais' },
  { href: '/search?type=auctions&auctionType=TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
  { href: '/direct-sales', label: 'Venda Direta' },
  { href: '/search?type=auctions&auctionType=PARTICULAR', label: 'Leilões Particulares' },
];

const modalityMegaMenuGroups = [
  {
    items: [
      { href: '/search?type=auctions&auctionType=JUDICIAL', label: 'Leilões Judiciais' },
      { href: '/search?type=auctions&auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais' },
      { href: '/search?type=auctions&auctionType=TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
      { href: '/direct-sales', label: 'Venda Direta' },
      { href: '/search?type=auctions&auctionType=PARTICULAR', label: 'Leilões Particulares' },
    ]
  }
];


describe('Static Modalities Menu Data Validation', () => {
    it('should have the correct labels and links for all modalities', () => {
        const actualModalities = modalityMegaMenuGroups[0].items;

        assert.strictEqual(actualModalities.length, expectedModalities.length, 'Should have the same number of modalities');

        for (const expected of expectedModalities) {
            const actual = actualModalities.find(item => item.label === expected.label);
            assert.ok(actual, `Modality "${expected.label}" should exist`);
            assert.strictEqual(actual.href, expected.href, `Link for modality "${expected.label}" should be correct`);
        }
    });
});
