
import { PrismaClient, AssetStatus, AuctionStatus, AuctionType, AuctionParticipation, UserHabilitationStatus, AccountType } from '@prisma/client';
import { randomUUID } from 'crypto';

// Polyfill for BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting CRUD Validation Script (BigInt Compatible)...');

    // 1. Setup Context (Tenant & User)
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found. Please seed the database first.');
    console.log(`✅ Context: Using Tenant [${tenant.name}] (${tenant.id})`);

    // Find an admin user or create one for testing
    let user = await prisma.user.findFirst({
        where: { email: 'admin@bidexpert.com.br' }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: `test-admin-${randomUUID().substring(0, 8)}@bidexpert.com.br`,
                password: 'hashed-password-placeholder',
                fullName: 'Test Admin',
                accountType: AccountType.PHYSICAL,
                habilitationStatus: UserHabilitationStatus.HABILITADO,
            }
        });
        console.log(`⚠️ Created temporary Admin User: ${user.email}`);
    }
    console.log(`✅ Context: Using User [${user.email}] (${user.id})`);

    // Ensure user is on tenant (userId, tenantId are BigInt)
    const userOnTenant = await prisma.usersOnTenants.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } }
    });
    if (!userOnTenant) {
        await prisma.usersOnTenants.create({
            data: { userId: user.id, tenantId: tenant.id, assignedBy: 'system' }
        });
        console.log(`✅ Linked User to Tenant`);
    }

    // 2. CRUD Category: "Equipamentos de Obras"
    const categorySlug = 'equipamentos-de-obras';
    let category = await prisma.lotCategory.findUnique({
        where: { slug: categorySlug }
    });

    if (!category) {
        category = await prisma.lotCategory.create({
            data: {
                name: 'Equipamentos de Obras',
                slug: categorySlug,
            }
        });
        console.log(`✅ Created Category: ${category.name}`);
    } else {
        console.log(`ℹ️ Category already exists: ${category.name}`);
    }

    // 3. CRUD Judicial Process
    // Requires: publicId, processNumber, tenantId
    const processNumber = `PROC-${randomUUID().substring(0, 8)}`;
    const judicialProcess = await prisma.judicialProcess.create({
        data: {
            publicId: `JP-${randomUUID().substring(0, 8)}`,
            processNumber: processNumber,
            tenantId: tenant.id,
            isElectronic: true,
        }
    });
    console.log(`✅ Created Judicial Process: ${judicialProcess.processNumber} (${judicialProcess.id})`);

    // 4. CRUD Media & Asset
    // Create MediaItem
    const mediaItem = await prisma.mediaItem.create({
        data: {
            fileName: 'escavadeira.jpg',
            storagePath: '/uploads/escavadeira.jpg',
            urlOriginal: 'https://placehold.co/600x400',
            mimeType: 'image/jpeg', // Required? Schema says String (not optional?) -> schema says String.
            // uploadedByUserId for User
            uploadedByUserId: user.id,
            tenantId: tenant.id, // Optional but good practice
            title: 'Foto da Escavadeira',
        }
    });
    console.log(`✅ Created MediaItem: ${mediaItem.id}`);

    // Create Asset linked to Process and Category
    const asset = await prisma.asset.create({
        data: {
            publicId: `AST-${randomUUID().substring(0, 8)}`,
            title: 'Escavadeira Hidráulica 2022',
            description: 'Em ótimo estado de conservação.',
            status: AssetStatus.CADASTRO,
            tenantId: tenant.id,
            categoryId: category!.id,
            judicialProcessId: judicialProcess.id,
            imageMediaId: mediaItem.id,
            galleryImageUrls: [mediaItem.urlOriginal],
            mediaItemIds: [mediaItem.id.toString()], // JSON
        }
    });
    console.log(`✅ Created Asset: ${asset.title} (${asset.id})`);

    // Verify Asset Link
    // include works
    const verifyAsset = await prisma.asset.findUnique({
        where: { id: asset.id },
        include: { judicialProcess: true }
    });
    if (!verifyAsset) throw new Error('❌ Failed to verify Asset insertion');
    if (verifyAsset.judicialProcessId !== judicialProcess.id) throw new Error('❌ Asset not linked to Judicial Process');
    console.log(`✅ Verified Asset linked to Process`);


    // 5. CRUD Auction
    const auctionSlug = `leilao-obras-${randomUUID().substring(0, 6)}`;
    const auction = await prisma.auction.create({
        data: {
            publicId: `AUC-${randomUUID().substring(0, 8)}`,
            title: 'Leilão Extraordinário de Equipamentos',
            slug: auctionSlug,
            status: AuctionStatus.RASCUNHO,
            auctionType: AuctionType.EXTRAJUDICIAL,
            participation: AuctionParticipation.ONLINE,
            tenantId: tenant.id,
            auctionDate: new Date(),
        }
    });
    console.log(`✅ Created Auction: ${auction.title} (${auction.id})`);

    // 6. Auction Stages
    // Schema: tenantId is REQUIRED for AuctionStage
    const stage = await prisma.auctionStage.create({
        data: {
            auctionId: auction.id,
            tenantId: tenant.id,
            name: 'Primeira Praça',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
            discountPercent: 100
        }
    });
    console.log(`✅ Created Auction Stage: ${stage.name}`);


    // 7. CRUD Lot linking Asset
    // Lot requires 'type' (String). 
    const lot = await prisma.lot.create({
        data: {
            publicId: `LOT-${randomUUID().substring(0, 8)}`,
            title: 'Lote 001 - Escavadeira',
            auctionId: auction.id,
            tenantId: tenant.id,
            status: 'RASCUNHO',
            initialPrice: 50000,
            price: 50000,
            description: verifyAsset.description,
            categoryId: category!.id,
            type: 'Asset', // Assuming 'type' is a generic string classification
        }
    });
    console.log(`✅ Created Lot: ${lot.title} (${lot.id})`);

    // 8. Link Asset to Lot (AssetsOnLots)
    await prisma.assetsOnLots.create({
        data: {
            lotId: lot.id,
            assetId: asset.id,
            tenantId: tenant.id,
            assignedBy: user.id.toString(), // String in schema
        }
    });
    console.log(`✅ Linked Asset to Lot`);

    // 9. Link Lot to Stage (LotStagePrice)
    // Schema: id, lotId, auctionId, auctionStageId, tenantId
    await prisma.lotStagePrice.create({
        data: {
            // Let's check schema:
            // model LotStagePrice { auctionStageId BigInt ... }
            auctionStageId: stage.id,
            lotId: lot.id,
            auctionId: auction.id,
            tenantId: tenant.id,
            initialBid: 50000
        }
    });
    console.log(`✅ Linked Lot to Auction Stage with price`);


    // FINAL VERIFICATION
    console.log('\n🔍 Final Verification...');

    const fullLot = await prisma.lot.findUnique({
        where: { id: lot.id },
        include: {
            assets: { include: { asset: true } },
            auction: { include: { stages: true } },
            lotPrices: true
        }
    });

    if (!fullLot) throw new Error('❌ Lot not found');
    if (fullLot.assets.length === 0) throw new Error('❌ Lot has no assets');
    // Compare BigInts using toString -> == or === might fail if instances differ?
    if (fullLot.assets[0].asset.id.toString() !== asset.id.toString()) throw new Error('❌ Wrong asset linked');
    if (fullLot.lotPrices.length === 0) throw new Error('❌ Lot has no stage prices');

    console.log('🎉 All CRUDs verified successfully!');
    console.log(`
  Summary:
  - Category: ${category!.name}
  - Process: ${judicialProcess.processNumber}
  - Asset: ${asset.title} (Linked to Process & Media)
  - Auction: ${auction.title}
  - Stage: ${stage.name}
  - Lot: ${lot.title} (Linked to Auction, Stage, & Asset)
  `);

}

main()
    .catch((e) => {
        console.error('❌ Script failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
