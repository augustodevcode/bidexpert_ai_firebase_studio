// tests/menu-content.test.ts
import test from 'node:test';
import assert from 'node:assert';
import puppeteer from 'puppeteer';
import { prisma } from '../src/lib/prisma';
import { CategoryService } from '../src/services/category.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';

const BASE_URL = 'http://localhost:9002'; // A porta em que a aplicação está rodando

async function getMenuLinks(page: puppeteer.Page, triggerSelector: string) {
    // Clica no gatilho para abrir o menu
    await page.hover(triggerSelector);
    // Aguarda o menu aparecer de forma explícita
    const menuViewportSelector = `${triggerSelector}[data-state=open] + .radix-navigation-menu-viewport`;
    await page.waitForSelector(menuViewportSelector, { visible: true, timeout: 10000 });
    
    // Extrai os links do menu visível
    const links = await page.evaluate((selector) => {
        const menuContent = document.querySelector(selector);
        if (!menuContent) return [];
        const anchors = Array.from(menuContent.querySelectorAll('a'));
        return anchors.map(a => ({
            href: a.getAttribute('href'),
            text: a.innerText.trim()
        }));
    }, menuViewportSelector);

    return links;
}


test.describe('Dynamic Menu Content E2E Tests', () => {
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
        await prisma.$disconnect();
    });

    test('should display categories from database in the main menu', async () => {
        // Arrange
        const categoryService = new CategoryService();
        const dbCategories = await categoryService.getCategories();
        const first8DbCategories = dbCategories.slice(0, 8); // O megamenu mostra os primeiros 8

        // Act
        const menuItems = await getMenuLinks(page, 'button[aria-haspopup="menu"]:has(span:text-is("Categorias de Oportunidades"))');
        
        console.log('--- Categories found in Menu UI ---');
        console.log(menuItems);
        console.log('---------------------------------');
        
        // Assert
        assert.ok(menuItems.length >= first8DbCategories.length, `Should find at least ${first8DbCategories.length} categories in the menu`);
        
        for (const dbCategory of first8DbCategories) {
            const menuItem = menuItems.find(item => item.text === dbCategory.name);
            assert.ok(menuItem, `Category "${dbCategory.name}" should exist in the menu`);
            assert.strictEqual(menuItem.href, `/category/${dbCategory.slug}`, `Link for category "${dbCategory.name}" should be correct`);
        }
    });

    test('should display consignors from database in the main menu', async () => {
        // Arrange
        const sellerService = new SellerService();
        const dbSellers = await sellerService.getSellers();
        const first5DbSellers = dbSellers.slice(0, 5);

        // Act
        const menuItems = await getMenuLinks(page, 'button[aria-haspopup="menu"]:has(span:text-is("Comitentes"))');
        
        console.log('--- Consignors found in Menu UI ---');
        console.log(menuItems);
        console.log('---------------------------------');

        // Assert
        assert.ok(menuItems.length >= first5DbSellers.length, `Should find at least ${first5DbSellers.length} consignors in the menu`);
        
        for (const dbSeller of first5DbSellers) {
            const menuItem = menuItems.find(item => item.text && item.text.includes(dbSeller.name));
            assert.ok(menuItem, `Seller "${dbSeller.name}" should exist in the menu`);
            assert.strictEqual(menuItem.href, `/sellers/${dbSeller.slug || dbSeller.publicId || dbSeller.id}`, `Link for seller "${dbSeller.name}" should be correct`);
        }
    });
    
    test('should display auctioneers from database in the main menu', async () => {
        // Arrange
        const auctioneerService = new AuctioneerService();
        const dbAuctioneers = await auctioneerService.getAuctioneers();
        const first5DbAuctioneers = dbAuctioneers.slice(0, 5);

        // Act
        const menuItems = await getMenuLinks(page, 'button[aria-haspopup="menu"]:has(span:text-is("Leiloeiros"))');
        
        console.log('--- Auctioneers found in Menu UI ---');
        console.log(menuItems);
        console.log('----------------------------------');

        // Assert
        assert.ok(menuItems.length >= first5DbAuctioneers.length, `Should find at least ${first5DbAuctioneers.length} auctioneers in the menu`);
        
        for (const dbAuctioneer of first5DbAuctioneers) {
            const menuItem = menuItems.find(item => item.text && item.text.includes(dbAuctioneer.name));
            assert.ok(menuItem, `Auctioneer "${dbAuctioneer.name}" should exist in the menu`);
            assert.strictEqual(menuItem.href, `/auctioneers/${dbAuctioneer.slug || dbAuctioneer.publicId || dbAuctioneer.id}`, `Link for auctioneer "${dbAuctioneer.name}" should be correct`);
        }
    });
});
