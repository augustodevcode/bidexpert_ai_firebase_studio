// tests/modalities-menu.test.ts
import test from 'node:test';
import assert from 'node:assert';
import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:9002'; 

const expectedModalities = [
  { href: '/search?type=auctions&auctionType=JUDICIAL', label: 'Leilões Judiciais' },
  { href: '/search?type=auctions&auctionType=EXTRAJUDICIAL', label: 'Leilões Extrajudiciais' },
  { href: '/search?type=auctions&auctionType=TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
  { href: '/direct-sales', label: 'Venda Direta' },
  { href: '/search?type=auctions&auctionType=PARTICULAR', label: 'Leilões Particulares' },
];

test.describe('Static Modalities Menu E2E Test', () => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;

    test.before(async () => {
        browser = await puppeteer.launch({
            headless: false, // Run in non-headless mode to observe
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    });

    test.after(async () => {
        await browser.close();
    });

    test('should display all static modality links correctly', async () => {
        // Arrange
        const triggerSelector = 'button[aria-haspopup="menu"]:has(span:text-is("Modalidades"))';

        // Act
        await page.hover(triggerSelector);
        const menuViewportSelector = `${triggerSelector}[data-state=open] + .radix-navigation-menu-viewport`;
        await page.waitForSelector(menuViewportSelector, { visible: true, timeout: 10000 });
        
        const menuItems = await page.evaluate((selector) => {
            const menuContent = document.querySelector(selector);
            if (!menuContent) return [];
            const anchors = Array.from(menuContent.querySelectorAll('a'));
            return anchors.map(a => ({
                href: a.getAttribute('href'),
                text: a.innerText.trim().split('\n')[0] // Pega apenas a primeira linha do texto (o label)
            }));
        }, menuViewportSelector);
        
        console.log('--- Modalities found in Menu UI ---');
        console.log(menuItems);
        console.log('---------------------------------');

        // Assert
        assert.strictEqual(menuItems.length, expectedModalities.length, `Should find exactly ${expectedModalities.length} modality links`);

        for (const expected of expectedModalities) {
            const menuItem = menuItems.find(item => item.text === expected.label);
            assert.ok(menuItem, `Modality "${expected.label}" should exist in the menu`);
            assert.strictEqual(menuItem.href, expected.href, `Link for modality "${expected.label}" should be correct`);
        }
    });
});
