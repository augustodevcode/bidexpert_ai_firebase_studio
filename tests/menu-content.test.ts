
// tests/menu-content.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { CategoryService } from '../src/services/category.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import type { LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '../src/types';

const testCategoryName = "Test Menu Category";
const testSellerName = "Test Menu Seller";
const testAuctioneerName = "Test Menu Auctioneer";

// Este teste agora valida a lógica de dados que alimenta os menus,
// sem depender de um banco de dados pré-populado.
test.describe('Dynamic Menu Content Data Validation', () => {

    // ARRANGE: Cria os dados de teste antes de executar os testes
    test.before(async () => {
        console.log('--- E2E Menu Test: Creating prerequisite data... ---');
        await prisma.lotCategory.create({
            data: { name: testCategoryName, slug: 'test-menu-category', hasSubcategories: false }
        });
        await prisma.seller.create({
            data: { name: testSellerName, slug: 'test-menu-seller', publicId: 'seller-menu-test', isJudicial: false }
        });
        await prisma.auctioneer.create({
            data: { name: testAuctioneerName, slug: 'test-menu-auctioneer', publicId: 'auctioneer-menu-test' }
        });
        console.log('--- E2E Menu Test: Prerequisite data created. ---');
    });

    // TEARDOWN: Limpa os dados de teste após a execução de todos os testes
    test.after(async () => {
        console.log('--- E2E Menu Test: Cleaning up test data... ---');
        try {
            await prisma.lotCategory.deleteMany({ where: { name: testCategoryName } });
            await prisma.seller.deleteMany({ where: { name: testSellerName } });
            await prisma.auctioneer.deleteMany({ where: { name: testAuctioneerName } });
        } catch (error) {
            console.error('Error during menu test cleanup:', error);
        }
        await prisma.$disconnect();
        console.log('--- E2E Menu Test: Cleanup complete. ---');
    });

    test('should fetch categories and they should be available for the menu', async () => {
        // Arrange
        const categoryService = new CategoryService();
        
        // Act
        const dbCategories = await categoryService.getCategories();
        const testCategory = dbCategories.find(c => c.name === testCategoryName);
        
        console.log('--- Categories found from DB for Menu ---');
        console.log(dbCategories.map(c => ({ name: c.name, slug: c.slug })));
        console.log('-----------------------------------------');
        
        // Assert
        assert.ok(dbCategories.length > 0, 'Should fetch at least one category from the database');
        assert.ok(testCategory, `The test category "${testCategoryName}" should be found`);
        assert.ok(testCategory.name, 'Category should have a name');
        assert.ok(testCategory.slug, 'Category should have a slug');
    });

    test('should fetch consignors and they should be available for the menu', async () => {
        // Arrange
        const sellerService = new SellerService();

        // Act
        const dbSellers = await sellerService.getSellers();
        const testSeller = dbSellers.find(s => s.name === testSellerName);

        console.log('--- Consignors found from DB for Menu ---');
        console.log(dbSellers.map(s => ({ name: s.name, slug: s.slug })));
        console.log('---------------------------------------');
        
        // Assert
        assert.ok(dbSellers.length > 0, 'Should fetch at least one seller from the database');
        assert.ok(testSeller, `The test seller "${testSellerName}" should be found`);
        assert.ok(testSeller.name, 'Seller should have a name');
        assert.ok(testSeller.slug, 'Seller should have a slug');
    });
    
    test('should fetch auctioneers and they should be available for the menu', async () => {
        // Arrange
        const auctioneerService = new AuctioneerService();
        
        // Act
        const dbAuctioneers = await auctioneerService.getAuctioneers();
        const testAuctioneer = dbAuctioneers.find(a => a.name === testAuctioneerName);

        console.log('--- Auctioneers found from DB for Menu ---');
        console.log(dbAuctioneers.map(a => ({ name: a.name, slug: a.slug })));
        console.log('--------------------------------------');

        // Assert
        assert.ok(dbAuctioneers.length > 0, 'Should fetch at least one auctioneer from the database');
        assert.ok(testAuctioneer, `The test auctioneer "${testAuctioneerName}" should be found`);
        assert.ok(testAuctioneer.name, 'Auctioneer should have a name');
        assert.ok(testAuctioneer.slug, 'Auctioneer should have a slug');
    });
});
