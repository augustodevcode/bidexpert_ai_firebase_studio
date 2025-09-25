// src/scripts/seed-db-sample-data.ts
/**
 * @fileoverview Populates the database with a complete set of sample data
 * for demonstration and E2E testing. It creates entities like categories,
 * sellers, auctioneers, and auctions of various types, all linked to the
 * "Landlord" tenant (ID '1').
 *
 * This script exclusively uses Server Actions to create data, ensuring that
 * all business logic, validation, and multi-tenant context are correctly applied,
 * mimicking creation through the application's UI/API layer.
 *
 * @important This script must be run AFTER the essential seed (`npm run db:seed`).
 */
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { slugify } from '@/lib/ui-helpers';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser, createTestPrerequisites } from '../tests/test-utils';
import type { AuctionFormData, AssetFormData, LotFormData, UserProfileWithPermissions } from '@/types';

// Import Server Actions
import { createUser, getAdminUserForDev, getUserProfileData } from '@/app/admin/users/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createAuctioneer } from '@/app/admin/auctioneers/actions';
import { createAuction } from '@/app/admin/auctions/actions';
import { createAsset } from '@/app/admin/assets/actions';
import { createLot } from '@/app/admin/lots/actions';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';

const testRunId = `sample-data-${uuidv4().substring(0, 4)}`;

async function seedSampleData() {
  console.log(`--- [DB SEED SAMPLES - ${testRunId}] Starting full sample data seeding using Server Actions... ---`);

  try {
    // 1. Get the Admin User to perform actions
    console.log('[DB SEED SAMPLES] Fetching admin user to perform actions...');
    let adminUser = await getAdminUserForDev();
    if (!adminUser) {
      throw new Error('Admin user (admin@bidexpert.com.br) not found. Please run `npm run db:seed` first.');
    }
    console.log(`[DB SEED SAMPLES] ✅ Actions will be performed by: ${adminUser.email}`);

    // We can assume the "Landlord" tenant (ID '1') exists from the essential seed.

    // 2. Create Core Entities via Actions
    console.log('[DB SEED SAMPLES] Creating sample entities (Sellers, Auctioneers, Categories)...');
    
    const categoryNames = ['Veículos', 'Imóveis', 'Equipamentos Industriais', 'Arte e Antiguidades'];
    const categories = await Promise.all(
        categoryNames.map(name => prisma.lotCategory.upsert({
            where: { name: `${name} ${testRunId}` },
            update: {},
            create: { name: `${name} ${testRunId}`, slug: slugify(`${name}-${testRunId}`), hasSubcategories: false }
        }))
    );
    
    const sellerResult = await callActionAsUser(createSeller, adminUser, { name: `Comitente Exemplo ${testRunId}`, isJudicial: false } as any);
    const auctioneerResult = await callActionAsUser(createAuctioneer, adminUser, { name: `Leiloeiro Exemplo ${testRunId}` } as any);

    if (!sellerResult.success || !auctioneerResult.success) {
        throw new Error(`Failed to create Seller or Auctioneer. Seller: ${sellerResult.message}. Auctioneer: ${auctioneerResult.message}`);
    }
    
    const sellerId = sellerResult.sellerId!;
    const auctioneerId = auctioneerResult.auctioneerId!;
    console.log('[DB SEED SAMPLES] ✅ Core entities created.');

    // 3. Create a Judicial Process via Action
    const court = await prisma.court.create({ data: { name: `Tribunal Exemplo ${testRunId}`, stateUf: 'SP' }});
    const state = await prisma.state.findUnique({ where: { uf: 'SP' } });
    const district = await prisma.judicialDistrict.create({ data: { name: `Comarca Exemplo ${testRunId}`, courtId: court.id, stateId: state!.id } });
    const branch = await prisma.judicialBranch.create({ data: { name: `Vara Exemplo ${testRunId}`, districtId: district.id } });
    
    const judicialProcessResult = await callActionAsUser(createJudicialProcessAction, adminUser, {
        processNumber: `1234567-89.${new Date().getFullYear()}.8.26.${testRunId}`,
        courtId: court.id,
        districtId: district.id,
        branchId: branch.id,
        sellerId: sellerId,
        parties: [{ name: `Autor Exemplo ${testRunId}`, partyType: 'AUTOR' }]
    } as any);
    
    if(!judicialProcessResult.success) throw new Error(`Failed to create judicial process: ${judicialProcessResult.message}`);
    const judicialProcessId = judicialProcessResult.processId!;
    console.log('[DB SEED SAMPLES] ✅ Judicial process created.');


    // 4. Create Assets via Action
    console.log('[DB SEED SAMPLES] Creating sample assets...');
    const asset1Result = await callActionAsUser(createAsset, adminUser, { title: `Carro Sedan ${testRunId}`, status: 'DISPONIVEL', categoryId: categories[0].id, sellerId, evaluationValue: 45000 } as AssetFormData);
    const asset2Result = await callActionAsUser(createAsset, adminUser, { title: `Apartamento Centro ${testRunId}`, status: 'DISPONIVEL', categoryId: categories[1].id, sellerId, evaluationValue: 300000 } as AssetFormData);
    const asset3Result = await callActionAsUser(createAsset, adminUser, { title: `Trator Agrícola ${testRunId}`, status: 'DISPONIVEL', judicialProcessId: judicialProcessId, categoryId: categories[2].id, sellerId, evaluationValue: 80000 } as AssetFormData);
    
    if(!asset1Result.success || !asset2Result.success || !asset3Result.success) throw new Error('Failed to create one or more assets.');
    const asset1Id = asset1Result.assetId!;
    const asset2Id = asset2Result.assetId!;
    const asset3Id = asset3Result.assetId!;
    console.log('[DB SEED SAMPLES] ✅ Sample assets created.');

    // 5. Create Auctions via Action
    console.log('[DB SEED SAMPLES] Creating sample auctions...');
    const auction1Result = await callActionAsUser(createAuction, adminUser, { title: `Leilão de Veículos Usados ${testRunId}`, status: 'ABERTO_PARA_LANCES', auctioneerId, sellerId, categoryId: categories[0].id, auctionDate: new Date(), endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) } as Partial<AuctionFormData>);
    const auction2Result = await callActionAsUser(createAuction, adminUser, { title: `Leilão Judicial de Imóveis ${testRunId}`, status: 'EM_BREVE', auctioneerId, sellerId, categoryId: categories[1].id, judicialProcessId, auctionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) } as Partial<AuctionFormData>);
    
    if(!auction1Result.success || !auction2Result.success) throw new Error('Failed to create one or more auctions.');
    const auction1Id = auction1Result.auctionId!;
    const auction2Id = auction2Result.auctionId!;
    console.log('[DB SEED SAMPLES] ✅ Sample auctions created.');

    // 6. Create Lots via Action
    console.log('[DB SEED SAMPLES] Creating sample lots...');
    await callActionAsUser(createLot, adminUser, { title: `Lote: Carro Sedan ${testRunId}`, auctionId: auction1Id, assetIds: [asset1Id], price: 35000, initialPrice: 35000, type: categories[0].id, status: 'ABERTO_PARA_LANCES' } as Partial<LotFormData>);
    await callActionAsUser(createLot, adminUser, { title: `Lote: Apartamento Centro ${testRunId}`, auctionId: auction2Id, assetIds: [asset2Id], price: 280000, initialPrice: 280000, type: categories[1].id, status: 'EM_BREVE' } as Partial<LotFormData>);
    await callActionAsUser(createLot, adminUser, { title: `Lote: Trator Agrícola ${testRunId}`, auctionId: auction2Id, assetIds: [asset3Id], price: 75000, initialPrice: 75000, type: categories[2].id, status: 'EM_BREVE' } as Partial<LotFormData>);
    console.log('[DB SEED SAMPLES] ✅ Sample lots created.');

    console.log('--- [DB SEED SAMPLES] Sample data seeding process completed successfully. ---');

  } catch (error: any) {
    console.error(`[DB SEED SAMPLES] ❌ FATAL ERROR during sample data seeding: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    await seedSampleData();
  } catch (error) {
    console.error('[DB SEED SAMPLES] ❌ Exiting due to fatal error.', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
