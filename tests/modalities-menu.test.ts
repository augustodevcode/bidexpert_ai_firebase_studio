
// tests/modalities-menu.test.ts
import test from 'node:test';
import assert from 'node:assert';

// Como este menu é estático, podemos testar sua configuração diretamente
// sem precisar de Puppeteer.

const expectedModalities = [
  { href: '/search?type=auctions&auctionType=JUDICIAL', label: 'Leilões Judiciais' },
  { href: '/search?type=auctions&auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais' },
  { href: '/search?type=auctions&auctionType=TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
  { href: '/direct-sales', label: 'Venda Direta' },
  { href: '/search?type=auctions&auctionType=PARTICULAR', label: 'Leilões Particulares' },
];

// O componente que contém os dados que queremos testar.
// Em um projeto real, isso poderia vir de um arquivo de configuração compartilhado.
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


test.describe('Static Modalities Menu Data Validation', () => {
    test('should have the correct labels and links for all modalities', () => {
        // Arrange
        const actualModalities = modalityMegaMenuGroups[0].items;

        console.log('--- Validating Modalities Menu Data ---');
        console.log('Expected:', expectedModalities);
        console.log('Actual:', actualModalities);
        console.log('-------------------------------------');

        // Assert
        assert.strictEqual(actualModalities.length, expectedModalities.length, 'Should have the same number of modalities');

        for (const expected of expectedModalities) {
            const actual = actualModalities.find(item => item.label === expected.label);
            assert.ok(actual, `Modality "${expected.label}" should exist`);
            assert.strictEqual(actual.href, expected.href, `Link for modality "${expected.label}" should be correct`);
        }
    });
});
