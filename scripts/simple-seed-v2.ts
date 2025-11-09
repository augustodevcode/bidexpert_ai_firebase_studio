// scripts/simple-seed-v2.ts
/**
 * @fileoverview Script de seed simplificado para a plataforma BidExpert v2
 * Usa apenas services (sem acesso direto ao prisma) para criar dados de teste
 */

// @ts-ignore - necessário para lidar com bigint
BigInt.prototype.toJSON = function() { return this.toString(); };

import { TenantService } from '../src/services/tenant.service';
import { RoleService } from '../src/services/role.service';
import { UserService } from '../src/services/user.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { SellerService } from '../src/services/seller.service';
import { AuctionService } from '../src/services/auction.service';
import { CategoryService } from '../src/services/category.service';
import { AssetService } from '../src/services/asset.service';
import { LotService } from '../src/services/lot.service';
import { BidService } from '../src/services/bid.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { Decimal } from '@prisma/client/runtime/library';
import type { 
    AssetFormData, Tenant, Role, User,
    AuctioneerProfileInfo, SellerProfileInfo,
    Auction, Asset, LotCategory, AuctionFormData
} from '../src/types';
import { AuctionStageService } from '../src/services/auction-stage.service';
import type { CreateSeedContext } from './seed-types';
import { createAuctionStages } from './auction-stages';
import { randomUUID } from 'crypto';

// RN-001: Isolamento Multi-Tenant - Todos serviços necessários
const services = {
    auctionStage: new AuctionStageService(),
    tenant: new TenantService(),
    role: new RoleService(),
    user: new UserService(),
    auctioneer: new AuctioneerService(),
    seller: new SellerService(),
    auction: new AuctionService(),
    category: new CategoryService(),
    asset: new AssetService(),
    lot: new LotService(),
    bid: new BidService(),
    platformSettings: new PlatformSettingsService(),
};

async function createTenant(): Promise<CreateSeedContext['tenant']> {
    console.log('\n1. Criando tenant...');
    const tenantResult = await services.tenant.createTenant({
        name: 'Leilões Brasil',
        subdomain: 'leiloes-brasil',
    });
    if (!tenantResult.success || !tenantResult.tenant) throw new Error(tenantResult.message);
    
    // Convertendo para o tipo Tenant da camada de frontend
    const tenant: CreateSeedContext['tenant'] = {
        id: tenantResult.tenant.id.toString(),
        name: tenantResult.tenant.name,
        subdomain: tenantResult.tenant.subdomain,
        domain: tenantResult.tenant.domain,
        createdAt: tenantResult.tenant.createdAt,
        updatedAt: tenantResult.tenant.updatedAt,
    };

    await services.platformSettings.getSettings(tenant.id);
    return tenant;
}

async function createRoles(tenant: CreateSeedContext['tenant']): Promise<CreateSeedContext['roles']> {
    console.log('\n2. Criando roles...');
    const rolesData = [
        {
            name: 'Administrator',
            nameNormalized: 'ADMINISTRATOR',
            description: 'Administrador do sistema',
            permissions: ['manage_all']
        },
        {
            name: 'Bidder',
            nameNormalized: 'BIDDER',
            description: 'Arrematante',
            permissions: ['bid:create', 'bid:read']
        },
        {
            name: 'Auctioneer',
            nameNormalized: 'AUCTIONEER',
            description: 'Leiloeiro',
            permissions: ['auction:create', 'auction:update']
        }
    ];

    const createdRoles: Record<string, any> = {};
    for (const role of rolesData) {
        const roleResult = await services.role.createRole(role);
        if (roleResult.success && roleResult.roleId) {
            const role = await services.role.getRoleById(roleResult.roleId);
            if (role) createdRoles[role.nameNormalized] = role;
        }
    }
    return createdRoles;
}

async function createAdmin(ctx: Pick<CreateSeedContext, 'tenant' | 'roles'>): Promise<CreateSeedContext['admin']> {
    console.log('\n3. Criando usuário admin...');
    const adminUserResult = await services.user.createUser({
        email: 'admin@example.com',
        fullName: 'Administrador',
        password: 'admin123',
        habilitationStatus: 'HABILITADO',
        accountType: 'LEGAL',
        roleIds: [String(ctx.roles['ADMINISTRATOR'].id)],
        tenantId: ctx.tenant.id.toString(),
    });
    if (!adminUserResult.success || !adminUserResult.userId) throw new Error(adminUserResult.message);
    const admin = await services.user.getUserById(adminUserResult.userId.toString());
    if (!admin) throw new Error('Admin user not found after creation');
    return admin;
}

async function createAuctioneer(ctx: Pick<CreateSeedContext, 'tenant' | 'admin'>): Promise<CreateSeedContext['auctioneer']> {
    console.log('\n4. Criando leiloeiro...');
    const auctioneerResult = await services.auctioneer.createAuctioneer(ctx.tenant.id, {
        name: 'Leiloeiro Oficial',
        registrationNumber: 'JUCESP-123',
        userId: ctx.admin.id,
        address: 'Av. Paulista, 1000, Andar 10, Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        contactName: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'leiloeiro@example.com',
        description: 'Leiloeiro oficial com mais de 10 anos de experiência',
        website: 'www.example.com',
        logoUrl: 'https://via.placeholder.com/150x150?text=Leiloeiro',
        logoMediaId: null,
        dataAiHintLogo: null,
        latitude: -23.5629,
        longitude: -46.6544,
    });
    if (!auctioneerResult.success || !auctioneerResult.auctioneerId) throw new Error(auctioneerResult.message);
    const auctioneer = await services.auctioneer.getAuctioneerById(ctx.tenant.id, auctioneerResult.auctioneerId);
    if (!auctioneer) throw new Error('Auctioneer not found after creation');
    return auctioneer;
}

async function createSeller(ctx: Pick<CreateSeedContext, 'tenant'>): Promise<CreateSeedContext['seller']> {
    console.log('\n5. Criando comitente...');
    const sellerResult = await services.seller.createSeller(ctx.tenant.id, {
        name: 'Comitente Vendedor',
        tenantId: ctx.tenant.id,
        isJudicial: false,
        address: 'Rua do Comércio, 500',
        zipCode: '04538-132',
        contactName: 'Maria Silva',
        phone: '(11) 98888-8888',
        email: 'comitente@example.com',
        description: 'Empresa especializada em venda de ativos',
        website: 'www.example.com',
        logoUrl: 'https://via.placeholder.com/150x150?text=Comitente',
        logoMediaId: null,
        dataAiHintLogo: null,
    });
    if (!sellerResult.success || !sellerResult.sellerId) throw new Error(sellerResult.message);
    const seller = await services.seller.getSellerById(ctx.tenant.id, sellerResult.sellerId);
    if (!seller) throw new Error('Seller not found after creation');
    return seller;
}

async function createAuction(ctx: Pick<CreateSeedContext, 'tenant' | 'auctioneer' | 'seller'>): Promise<CreateSeedContext['auction']> {
    console.log('\n6. Criando leilão...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // 7 dias a partir de agora
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30 dias de duração

    // De acordo com RN-008: Timeline de Etapas
    const data: AuctionFormData = {
        title: 'Leilão de Imóveis e Veículos',
        description: 'Excelentes oportunidades em imóveis e veículos',
        auctionType: 'EXTRAJUDICIAL',
        status: 'EM_BREVE',
        auctioneerId: BigInt(ctx.auctioneer.id), // RN-012: Usando BigInt
        sellerId: BigInt(ctx.seller.id), // RN-012: Usando BigInt
        auctionDate: startDate,
        endDate: endDate,
        softCloseEnabled: true,
        termsAndConditions: 'Termos e condições padrão do leilão...',
        // RN-008: Implementação correta das etapas do leilão
        auctionStages: [
            {
                name: '2ª Praça',
                startDate: startDate,
                endDate: endDate,
                initialPrice: 100000 // Preço inicial da praça
            },
            {
                name: '1ª Praça',
                startDate: new Date(startDate.getTime() - (7 * 24 * 60 * 60 * 1000)), // 7 dias antes
                endDate: new Date(startDate.getTime() - (1 * 24 * 60 * 60 * 1000)), // 1 dia antes da 2ª praça
                initialPrice: 150000 // Preço 50% maior na primeira praça
            }
        ],
    };

    const auctionResult = await services.auction.createAuction(ctx.tenant.id, data);
    if (!auctionResult.success || !auctionResult.auctionId) throw new Error(auctionResult.message);

    const auction = await services.auction.getAuctionById(ctx.tenant.id, auctionResult.auctionId);
    if (!auction) throw new Error('Auction not found after creation');
    return auction;
}

async function createCategories(ctx: Pick<CreateSeedContext, 'tenant'>): Promise<CreateSeedContext['categories']> {
    console.log('\n7. Criando categorias...');
    const categories = [
        { name: 'Imóveis', description: 'Categoria de Imóveis' },
        { name: 'Veículos', description: 'Categoria de Veículos' },
        { name: 'Máquinas', description: 'Categoria de Máquinas' },
    ];

    const createdCategories: CreateSeedContext['categories'] = [];
    for (const category of categories) {
        const categoryResult = await services.category.createCategory({
            name: category.name,
            description: category.description,
        });
        if (categoryResult.success && categoryResult.category) {
            // Convertendo para o tipo da camada de frontend
            const cat: CreateSeedContext['categories'][0] = {
                id: categoryResult.category.id.toString(),
                name: categoryResult.category.name,
                slug: categoryResult.category.slug,
                description: categoryResult.category.description,
                logoUrl: categoryResult.category.logoUrl,
                logoMediaId: null, // Mantendo null pois é seed
                dataAiHintLogo: categoryResult.category.dataAiHintLogo,
                coverImageUrl: categoryResult.category.coverImageUrl,
                coverImageMediaId: null, // Mantendo null pois é seed
                dataAiHintCover: categoryResult.category.dataAiHintCover,
                createdAt: categoryResult.category.createdAt,
                updatedAt: categoryResult.category.updatedAt,
                itemCount: 0,
                _count: { lots: 0, subcategories: 0 },
                megaMenuImageUrl: null,
                megaMenuImageMediaId: null,
                dataAiHintMegaMenu: null,
                hasSubcategories: false,
            };
            createdCategories.push(cat);
        }
    }
    return createdCategories;
}

async function createAssets(ctx: Pick<CreateSeedContext, 'tenant' | 'seller' | 'categories'>): Promise<CreateSeedContext['assets']> {
    console.log('\n8. Criando ativos...');
    const realEstateCategory = ctx.categories.find(c => c.name === 'Imóveis');
    const vehicleCategory = ctx.categories.find(c => c.name === 'Veículos');

    if (!realEstateCategory || !vehicleCategory) {
        throw new Error('Categorias necessárias não encontradas');
    }

    const assetsData = [
        {
            publicId: 'IMV001',
            categoryIds: [realEstateCategory.id.toString()],
            sellerId: ctx.seller.id.toString(),
            title: 'Casa em Condomínio',
            description: 'Linda casa com 3 quartos...',
            evaluationValue: 500000,
            details: {
                propertyType: 'HOUSE',
                area: 150,
                rooms: 3,
                parkingSpaces: 2,
                address: 'Rua das Flores, 123'
            }
        },
        {
            publicId: 'VEH001',
            categoryIds: [vehicleCategory.id.toString()],
            sellerId: ctx.seller.id.toString(),
            title: 'Carro Sedan Luxo',
            description: 'Veículo em excelente estado...',
            evaluationValue: 80000,
            details: {
                vehicleType: 'CAR',
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                mileage: 45000
            }
        }
    ];

    const createdAssets: CreateSeedContext['assets'] = [];
    for (const assetData of assetsData) {
        const assetResult = await services.asset.createAsset(ctx.tenant.id.toString(), assetData as AssetFormData);
        if (assetResult.success && assetResult.assetId) {
            const asset = await services.asset.getAssetById(ctx.tenant.id.toString(), assetResult.assetId);
            if (asset) createdAssets.push(asset);
        }
    }
    return createdAssets;
}

async function createLots(ctx: CreateSeedContext) {
    console.log('\n9. Criando lotes...');
    for (const asset of ctx.assets) {
        const lotResult = await services.lot.createLot({
            auctionId: ctx.auction.id.toString(),
            title: `Lote - ${asset.title}`,
            number: asset.publicId,
            price: asset.evaluationValue as number,
            assetIds: [asset.id.toString()],
            type: 'EXTRAJUDICIAL',
        }, ctx.tenant.id.toString());
        if (!lotResult.success) throw new Error(lotResult.message);
    }
}

async function main() {
    console.log('🚀 Iniciando seed simplificado v2...');

    const ctx: Partial<CreateSeedContext> = {};

    try {
        ctx.tenant = await createTenant();
        ctx.roles = await createRoles(ctx.tenant);
        ctx.admin = await createAdmin(ctx as Required<Pick<CreateSeedContext, 'tenant' | 'roles'>>);
        ctx.auctioneer = await createAuctioneer(ctx as Required<Pick<CreateSeedContext, 'tenant' | 'admin'>>);
        ctx.seller = await createSeller(ctx as Required<Pick<CreateSeedContext, 'tenant'>>);
        ctx.auction = await createAuction(ctx as Required<Pick<CreateSeedContext, 'tenant' | 'auctioneer' | 'seller'>>);
        ctx.categories = await createCategories(ctx as Required<Pick<CreateSeedContext, 'tenant'>>);
        ctx.assets = await createAssets(ctx as Required<Pick<CreateSeedContext, 'tenant' | 'seller' | 'categories'>>);
        await createLots(ctx as Required<CreateSeedContext>);

        console.log('\n✅ Seed concluído com sucesso!');
        console.log(`✅ Tenant: ${ctx.tenant.name}`);
        console.log(`✅ Admin: ${ctx.admin.email}`);
        console.log(`✅ Leiloeiro: ${ctx.auctioneer.name}`);
        console.log(`✅ Comitente: ${ctx.seller.name}`);
        console.log(`✅ Leilão: ${ctx.auction.title}`);
        console.log(`✅ Categorias: ${ctx.categories.length}`);
        console.log(`✅ Ativos: ${ctx.assets.length}`);
    } catch (error) {
        console.error("❌ Erro durante o seed:");
        console.error(error);
        process.exit(1);
    }
}
        isSetupComplete: true
    });

    // 3. Criar Roles
    console.log('\n2. Criando roles...');
    const rolesData = [
        {
            name: 'Administrator',
            nameNormalized: 'ADMINISTRATOR',
            description: 'Administrador do sistema',
            permissions: ['manage_all']
        },
        {
            name: 'Bidder',
            nameNormalized: 'BIDDER',
            description: 'Arrematante',
            permissions: ['bid:create', 'bid:read']
        },
        {
            name: 'Auctioneer',
            nameNormalized: 'AUCTIONEER',
            description: 'Leiloeiro',
            permissions: ['auction:create', 'auction:update']
        }
    ];

    const createdRoles: Record<string, any> = {};
    for (const role of rolesData) {
        const roleResult = await services.role.createRole(role);
        if (roleResult.success && roleResult.roleId) {
            createdRoles[role.nameNormalized] = await services.role.getRoleById(roleResult.roleId);
        }
    }

    // 4. Criar Admin
    console.log('\n3. Criando usuário admin...');
    const adminUserResult = await services.user.createUser({
        email: 'admin@example.com',
        fullName: 'Administrador',
        password: 'admin123',
        habilitationStatus: 'HABILITADO',
        accountType: 'LEGAL',
        roleIds: [String(createdRoles['ADMINISTRATOR'].id)],
        tenantId: tenant.id.toString(),
    });
    if (!adminUserResult.success || !adminUserResult.userId) throw new Error(adminUserResult.message);
    const adminUser = await services.user.getUserById(adminUserResult.userId.toString());

    // 5. Criar Leiloeiro
    console.log('\n4. Criando leiloeiro...');
    const auctioneerResult = await services.auctioneer.createAuctioneer(tenant.id.toString(), {
        name: 'Leiloeiro Oficial',
        registrationNumber: 'JUCESP-123',
        userId: adminUser.id.toString(),
        city: 'São Paulo',
        state: 'SP',
        address: 'Av. Paulista, 1000',
        zipCode: '01310-100',
        contactName: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'leiloeiro@example.com',
        description: 'Leiloeiro oficial com mais de 10 anos de experiência',
        website: 'www.example.com',
        logoUrl: 'https://via.placeholder.com/150x150?text=Leiloeiro',
        logoMediaId: null,
        dataAiHintLogo: null,
    });
    if (!auctioneerResult.success || !auctioneerResult.auctioneerId) throw new Error(auctioneerResult.message);
    const auctioneer = await services.auctioneer.getAuctioneerById(tenant.id.toString(), auctioneerResult.auctioneerId);

    // 6. Criar Comitente
    console.log('\n5. Criando comitente...');
    const sellerResult = await services.seller.createSeller(tenant.id.toString(), {
        name: 'Comitente Vendedor',
        isJudicial: false,
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua do Comércio, 500',
        zipCode: '04538-132',
        contactName: 'Maria Silva',
        phone: '(11) 98888-8888',
        email: 'comitente@example.com',
        description: 'Empresa especializada em venda de ativos',
        website: 'www.example.com',
        logoUrl: 'https://via.placeholder.com/150x150?text=Comitente',
        logoMediaId: null,
        dataAiHintLogo: null,
    });
    if (!sellerResult.success || !sellerResult.sellerId) throw new Error(sellerResult.message);
    const seller = await services.seller.getSellerById(tenant.id.toString(), sellerResult.sellerId);

    // 7. Criar Leilão
    console.log('\n6. Criando leilão...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // 7 dias a partir de agora
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30 dias de duração

    const auctionResult = await services.auction.createAuction(tenant.id.toString(), {
        title: 'Leilão de Imóveis e Veículos',
        auctionType: 'EXTRAJUDICIAL',
        status: 'EM_BREVE',
        auctioneerId: auctioneer.id.toString(),
        sellerId: seller.id.toString(),
        auctionDate: startDate,
        endDate: endDate,
        softCloseEnabled: true,
        description: 'Excelentes oportunidades em imóveis e veículos',
        terms: 'Termos e condições do leilão...',
    });
    if (!auctionResult.success || !auctionResult.auctionId) throw new Error(auctionResult.message);
    const auction = await services.auction.getAuctionById(tenant.id.toString(), auctionResult.auctionId);

    // 8. Criar Categorias
    console.log('\n7. Criando categorias...');
    const categories = [
        { name: 'Imóveis', slug: 'imoveis', order: 1 },
        { name: 'Veículos', slug: 'veiculos', order: 2 },
        { name: 'Máquinas', slug: 'maquinas', order: 3 },
    ];

    const createdCategories = [];
    for (const category of categories) {
        const categoryResult = await services.category.createCategory({
            name: category.name,
            slug: category.slug,
            order: category.order,
            description: `Categoria de ${category.name}`,
            isActive: true,
        }, tenant.id.toString());
        if (categoryResult.success && categoryResult.categoryId) {
            const cat = await services.category.getCategoryById(categoryResult.categoryId);
            if (cat) createdCategories.push(cat);
        }
    }

    // 9. Criar Ativos
    console.log('\n8. Criando ativos...');
    const realEstateCategory = createdCategories.find(c => c.slug === 'imoveis');
    const vehicleCategory = createdCategories.find(c => c.slug === 'veiculos');

    if (!realEstateCategory || !vehicleCategory) {
        throw new Error('Categorias necessárias não encontradas');
    }

    const assetsData = [
        {
            publicId: 'IMV001',
            categoryIds: [realEstateCategory.id.toString()],
            sellerId: seller.id.toString(),
            title: 'Casa em Condomínio',
            description: 'Linda casa com 3 quartos...',
            evaluationValue: 500000,
            details: {
                propertyType: 'HOUSE',
                area: 150,
                rooms: 3,
                parkingSpaces: 2,
                address: 'Rua das Flores, 123'
            }
        },
        {
            publicId: 'VEH001',
            categoryIds: [vehicleCategory.id.toString()],
            sellerId: seller.id.toString(),
            title: 'Carro Sedan Luxo',
            description: 'Veículo em excelente estado...',
            evaluationValue: 80000,
            details: {
                vehicleType: 'CAR',
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                mileage: 45000
            }
        }
    ];

    const createdAssets = [];
    for (const assetData of assetsData) {
        const assetResult = await services.asset.createAsset(tenant.id.toString(), assetData as AssetFormData);
        if (assetResult.success && assetResult.assetId) {
            const asset = await services.asset.getAssetById(tenant.id.toString(), assetResult.assetId);
            if (asset) createdAssets.push(asset);
        }
    }

    // 10. Criar Lotes
    console.log('\n9. Criando lotes...');
    for (const asset of createdAssets) {
        const lotResult = await services.lot.createLot({
            auctionId: auction.id.toString(),
            title: `Lote - ${asset.title}`,
            number: asset.publicId,
            price: asset.evaluationValue as number,
            assetIds: [asset.id.toString()],
            type: 'EXTRAJUDICIAL',
        }, tenant.id.toString());
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log(`✅ Tenant: ${tenant.name}`);
    console.log(`✅ Admin: ${adminUser.email}`);
    console.log(`✅ Leiloeiro: ${auctioneer.name}`);
    console.log(`✅ Comitente: ${seller.name}`);
    console.log(`✅ Leilão: ${auction.title}`);
    console.log(`✅ Categorias: ${createdCategories.length}`);
    console.log(`✅ Ativos: ${createdAssets.length}`);
}

main()
    .catch((e) => {
        console.error("❌ Erro durante o seed:");
        console.error(e);
        process.exit(1);
    });