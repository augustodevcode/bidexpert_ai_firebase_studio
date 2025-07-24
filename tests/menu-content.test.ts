
// tests/menu-content.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { CategoryService } from '../src/services/category.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';

// Este teste agora valida a lógica de dados que alimenta os menus,
// sem depender do Puppeteer, o que é mais rápido e confiável no ambiente de servidor.

test.describe('Dynamic Menu Content Data Validation', () => {

    test.after(async () => {
        await prisma.$disconnect();
    });

    test('should fetch categories and they should be available for the menu', async () => {
        // Arrange
        const categoryService = new CategoryService();
        
        // Act
        const dbCategories = await categoryService.getCategories();
        
        console.log('--- Categories found from DB for Menu ---');
        console.log(dbCategories.map(c => ({ name: c.name, slug: c.slug })));
        console.log('-----------------------------------------');
        
        // Assert
        assert.ok(dbCategories.length > 0, 'Should fetch at least one category from the database');
        const firstCategory = dbCategories[0];
        assert.ok(firstCategory.name, 'Category should have a name');
        assert.ok(firstCategory.slug, 'Category should have a slug');
    });

    test('should fetch consignors and they should be available for the menu', async () => {
        // Arrange
        const sellerService = new SellerService();

        // Act
        const dbSellers = await sellerService.getSellers();

        console.log('--- Consignors found from DB for Menu ---');
        console.log(dbSellers.map(s => ({ name: s.name, slug: s.slug })));
        console.log('---------------------------------------');
        
        // Assert
        assert.ok(dbSellers.length > 0, 'Should fetch at least one seller from the database');
        const firstSeller = dbSellers[0];
        assert.ok(firstSeller.name, 'Seller should have a name');
        assert.ok(firstSeller.slug, 'Seller should have a slug');
    });
    
    test('should fetch auctioneers and they should be available for the menu', async () => {
        // Arrange
        const auctioneerService = new AuctioneerService();
        
        // Act
        const dbAuctioneers = await auctioneerService.getAuctioneers();

        console.log('--- Auctioneers found from DB for Menu ---');
        console.log(dbAuctioneers.map(a => ({ name: a.name, slug: a.slug })));
        console.log('--------------------------------------');

        // Assert
        assert.ok(dbAuctioneers.length > 0, 'Should fetch at least one auctioneer from the database');
        const firstAuctioneer = dbAuctioneers[0];
        assert.ok(firstAuctioneer.name, 'Auctioneer should have a name');
        assert.ok(firstAuctioneer.slug, 'Auctioneer should have a slug');
    });
});
