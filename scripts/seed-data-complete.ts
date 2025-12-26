
import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as bcrypt from 'bcrypt';
import { seedLogger } from './seed-logger';

// Import services
import { TenantService } from '../src/services/tenant.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { UserService } from '../src/services/user.service';
import { RoleService } from '../src/services/role.service';
import { StateService } from '../src/services/state.service';
import { CityService } from '../src/services/city.service';
import { CategoryService } from '../src/services/category.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { prisma } from '../src/lib/prisma';

// Initialize services
const services = {
    tenant: new TenantService(),
    platformSettings: new PlatformSettingsService(),
    user: new UserService(),
    role: new RoleService(),
    state: new StateService(),
    city: new CityService(),
    category: new CategoryService(),
    subcategory: new SubcategoryService(),
};

async function cleanDatabase() {
    console.log("🧹 Limpando banco de dados (Estratégia em Camadas)...");
    
    try {
        // Level 1: Tables with no dependencies or leaf-level dependencies
        await prisma.lotStagePrice.deleteMany({});
        await prisma.bid.deleteMany({});
        await prisma.userWin.deleteMany({});
        await prisma.installmentPayment.deleteMany({});
        await prisma.userLotMaxBid.deleteMany({});
        await prisma.lotQuestion.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.assetsOnLots.deleteMany({});
        await prisma.assetMedia.deleteMany({});
        await prisma.bidderNotification.deleteMany({});
        await prisma.participationHistory.deleteMany({});
        await prisma.paymentMethod.deleteMany({});
        await prisma.wonLot.deleteMany({});
        await prisma.iTSM_Message.deleteMany({});
        await prisma.iTSM_Ticket.deleteMany({});
        await prisma.iTSM_ChatLog.deleteMany({});
        await prisma.iTSM_QueryLog.deleteMany({});
        await prisma.iTSM_Attachment.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.formSubmission.deleteMany({});
        await prisma.lotRisk.deleteMany({});

        // Level 2: Tables with dependencies on Level 1
        await prisma.lot.deleteMany({});
        await prisma.auctionHabilitation.deleteMany({});
        await prisma.auctionStage.deleteMany({});
        await prisma.directSaleOffer.deleteMany({});
        await prisma.bidderProfile.deleteMany({});

        // Level 3: Tables with dependencies on Level 2
        await prisma.auction.deleteMany({});
        await prisma.asset.deleteMany({});
        await prisma.judicialProcess.deleteMany({});
        await prisma.userDocument.deleteMany({});

        // Level 4: Tables with dependencies on Level 3
        await prisma.usersOnRoles.deleteMany({});
        await prisma.usersOnTenants.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.seller.deleteMany({});
        await prisma.auctioneer.deleteMany({});
        await prisma.report.deleteMany({});

        // Level 5: Base tables with minimal dependencies
        // Note: We keep Roles and Tenants usually, but for a "Complete" seed we might want to ensure they are fresh or just upsert them.
        // v4 deletes them. v3 kept them. Let's follow v4's clean slate approach but be careful.
        // If we delete Roles, we must recreate ALL of them.
        await prisma.role.deleteMany({});
        await prisma.subcategory.deleteMany({});
        await prisma.lotCategory.deleteMany({});
        await prisma.judicialBranch.deleteMany({});
        await prisma.judicialDistrict.deleteMany({});
        await prisma.court.deleteMany({});
        await prisma.city.deleteMany({});
        await prisma.state.deleteMany({});
        await prisma.mediaItem.deleteMany({});
        
        console.log("✓ Banco de dados limpo com sucesso");
    } catch (error) {
        console.error("Erro ao limpar banco de dados:", error);
        throw error;
    }
}

async function main() {
    console.log('🌱 Iniciando Seed Completo (V4 Architecture + V3 Data)...\n');

    try {
        await cleanDatabase();

        // 1. TENANT
        console.log('📦 Criando Tenant Principal...');
        const { tenant } = await services.tenant.createTenant({
            name: 'BidExpert Main',
            subdomain: 'main' // or 'default' as in v3? v3 used 'default'. Let's use 'main' as it's cleaner, or 'default' to match v3 expectations if any. v3 used 'default'.
        });
        
        if (!tenant) throw new Error("Falha ao criar tenant");
        
        // Update to match v3 domain if needed, or keep 'main'
        await prisma.tenant.update({
            where: { id: tenant.id },
            data: { subdomain: 'default', domain: 'localhost' }
        });

        const tenantId = tenant.id;
        const tenantIdStr = tenant.id.toString();

        // Platform Settings
        await services.platformSettings.updateSettings(tenantIdStr, {
            siteTitle: 'BidExpert',
            siteTagline: 'Plataforma de Leilões',
            isSetupComplete: true
        });

        // 2. ROLES
        console.log('🎯 Criando Roles...');
        const rolesData = [
            { name: 'Administrator', nameNormalized: 'ADMIN', description: 'Administrador do sistema', permissions: ['manage_all'] },
            { name: 'Bidder', nameNormalized: 'BIDDER', description: 'Arrematante', permissions: ['bid:create', 'bid:read', 'view_auctions', 'view_lots'] },
            { name: 'Auctioneer', nameNormalized: 'LEILOEIRO', description: 'Leiloeiro', permissions: ['conduct_auctions', 'auctions:manage_assigned', 'lots:manage_assigned'] },
            { name: 'Seller', nameNormalized: 'VENDEDOR', description: 'Comitente', permissions: ['consignor_dashboard:view', 'auctions:manage_own', 'lots:manage_own'] },
            { name: 'Lawyer', nameNormalized: 'ADVOGADO', description: 'Advogado', permissions: ['lawyer_dashboard:view', 'lawyer_cases:view', 'lawyer_documents:manage'] },
            { name: 'Appraiser', nameNormalized: 'AVALIADOR', description: 'Avaliador', permissions: ['documents:generate_report'] },
            // NEW ROLE: AUCTION_ANALYST
            { 
                name: 'Auction Analyst', 
                nameNormalized: 'AUCTION_ANALYST', 
                description: 'Analista de Leilões', 
                permissions: [
                    'auctions:create', 'auctions:read', 'auctions:update', 'auctions:delete', 'auctions:publish',
                    'lots:create', 'lots:read', 'lots:update', 'lots:delete',
                    'assets:create', 'assets:read', 'assets:update', 'assets:delete',
                    'categories:create', 'categories:read', 'categories:update', 'categories:delete',
                    'auctioneers:create', 'auctioneers:read', 'auctioneers:update', 'auctioneers:delete',
                    'sellers:create', 'sellers:read', 'sellers:update', 'sellers:delete',
                    'judicial_processes:create', 'judicial_processes:read', 'judicial_processes:update', 'judicial_processes:delete',
                    'states:read', 'cities:read',
                    'media:upload', 'media:read', 'media:update', 'media:delete',
                    'view_reports'
                ]
            }
        ];

        const rolesMap: Record<string, any> = {};
        for (const r of rolesData) {
            // We use prisma directly here to ensure we can force the ID or just let it auto-increment but capture the object
            // Service createRole checks for duplicates, which is good.
            const result = await services.role.createRole({
                name: r.name,
                description: r.description,
                permissions: r.permissions
            });
            
            // We need to update nameNormalized to match exactly what we want (v3 used uppercase keys)
            // Service might normalize differently.
            const role = await prisma.role.findFirst({ where: { name: r.name } });
            if (role) {
                await prisma.role.update({
                    where: { id: role.id },
                    data: { nameNormalized: r.nameNormalized }
                });
                rolesMap[r.nameNormalized] = role;
            }
        }

        // 3. USERS
        console.log('👥 Criando Usuários...');
        const passwordHash = await bcrypt.hash('Test@12345', 10);
        const timestamp = Date.now();

        const usersConfig = [
            { role: 'LEILOEIRO', email: 'test.leiloeiro@bidexpert.com', name: 'Leiloeiro Test Premium', extraRoles: ['COMPRADOR', 'ADMIN'] },
            { role: 'BIDDER', email: 'test.comprador@bidexpert.com', name: 'Comprador Test', extraRoles: [] },
            { role: 'ADVOGADO', email: 'advogado@bidexpert.com.br', name: 'Dr. Advogado Test', extraRoles: ['COMPRADOR'] },
            { role: 'VENDEDOR', email: 'test.vendedor@bidexpert.com', name: 'Vendedor Test', extraRoles: ['COMPRADOR'] },
            { role: 'AVALIADOR', email: 'test.avaliador@bidexpert.com', name: 'Avaliador Test', extraRoles: [] },
            { role: 'AUCTION_ANALYST', email: 'analista@lordland.com', name: 'Analista de Leilões Lordland', extraRoles: [], password: 'password123' } // Specific password for analyst
        ];

        const usersMap: Record<string, any> = {};

        for (const u of usersConfig) {
            const pass = u.password ? await bcrypt.hash(u.password, 10) : passwordHash;
            
            const user = await prisma.user.create({
                data: {
                    email: u.email,
                    password: pass,
                    fullName: u.name,
                    cpf: faker.string.numeric(11),
                    accountType: 'PHYSICAL',
                    habilitationStatus: 'HABILITADO',
                }
            });

            // Assign Main Role
            if (rolesMap[u.role]) {
                await prisma.usersOnRoles.create({
                    data: { userId: user.id, roleId: rolesMap[u.role].id, assignedBy: 'system' }
                });
            }

            // Assign Extra Roles
            for (const extra of u.extraRoles) {
                if (rolesMap[extra]) {
                    await prisma.usersOnRoles.create({
                        data: { userId: user.id, roleId: rolesMap[extra].id, assignedBy: 'system' }
                    });
                }
            }

            // Assign Tenant
            await prisma.usersOnTenants.create({
                data: { userId: user.id, tenantId: tenantId, assignedBy: 'system' }
            });

            usersMap[u.role] = user;
        }

        // 4. LOCATIONS (States/Cities)
        console.log('🗺️ Criando Localidades...');
        // Create States
        const states = [
            { name: 'São Paulo', uf: 'SP' },
            { name: 'Rio de Janeiro', uf: 'RJ' },
            { name: 'Minas Gerais', uf: 'MG' },
            { name: 'Distrito Federal', uf: 'DF' },
            { name: 'Paraná', uf: 'PR' }
        ];
        
        for (const s of states) {
            await services.state.createState(s);
        }

        // 5. CATEGORIES
        console.log('🗂️ Criando Categorias...');
        const categoriesData = [
            { name: 'Imóveis', slug: 'imoveis', subcategories: ['Residencial', 'Comercial', 'Industrial'] },
            { name: 'Veículos', slug: 'veiculos', subcategories: ['Carros', 'Motos', 'Caminhões'] },
            { name: 'Maquinário', slug: 'maquinario', subcategories: ['Industrial', 'Agrícola'] },
            { name: 'Mobiliário', slug: 'mobiliario', subcategories: ['Escritório', 'Residencial'] }
        ];

        const categoriesMap: Record<string, any> = {};

        for (const cat of categoriesData) {
            const { category } = await services.category.createCategory({
                name: cat.name,
                description: cat.name
            });
            
            if (category) {
                // Update slug manually to match v3 expectations
                await prisma.lotCategory.update({
                    where: { id: category.id },
                    data: { slug: cat.slug, tenantId: tenantId }
                });
                categoriesMap[cat.slug] = category;

                for (const sub of cat.subcategories) {
                    await services.subcategory.createSubcategory({
                        name: sub,
                        parentCategoryId: category.id.toString(),
                        description: sub
                    });
                }
            }
        }

        // 6. JUDICIAL STRUCTURE
        console.log('⚖️ Criando Estrutura Judicial...');
        const court = await prisma.court.create({
            data: {
                slug: `tribunal-sp-${timestamp}`,
                name: 'Tribunal de Justiça de São Paulo',
                stateUf: 'SP',
                website: 'https://www.tjsp.jus.br',
            },
        });

        const district = await prisma.judicialDistrict.create({
            data: {
                slug: `comarca-sao-paulo-${timestamp}`,
                name: `Comarca de São Paulo`,
                courtId: court.id,
            },
        });

        const branch = await prisma.judicialBranch.create({
            data: {
                slug: `vara-civel-01-${timestamp}`,
                name: `1ª Vara Cível da Capital`,
                districtId: district.id,
                contactName: 'Dr. João Silva',
                phone: '(11) 3133-1000',
                email: 'vara.civel@tjsp.jus.br',
            },
        });

        // 7. SELLERS & AUCTIONEERS
        console.log('👨‍💼 Criando Sellers e Auctioneers...');
        
        // Judicial Seller
        const sellerJudicial = await prisma.seller.create({
            data: {
                publicId: `seller-${timestamp}`,
                slug: `leiloeiro-judicial-sp`,
                name: `Leiloeiro Judicial SP`,
                description: 'Leiloeiro autorizado pelo TJSP',
                tenantId: tenantId,
                judicialBranchId: branch.id,
            },
        });

        // Auctioneer Record (linked to the user created above)
        const auctioneerRecord = await prisma.auctioneer.create({
            data: {
                publicId: `auctn-${timestamp}`,
                slug: `leiloeiro-principal`,
                name: 'Leiloeiro Principal',
                tenantId: tenantId,
                userId: usersMap['LEILOEIRO'].id,
            }
        });

        // 8. AUCTIONS & LOTS (Transactional Data - using Prisma for precision)
        console.log('🔨 Criando Leilões e Lotes...');
        
        const auctionsData = [
            {
                title: 'Leilão Judicial - Imóveis',
                type: 'JUDICIAL',
                status: 'ABERTO',
                daysOffset: 7,
                items: [
                    { title: 'Sala Comercial Centro', type: 'IMOVEL', price: 150000, cat: 'imoveis' },
                    { title: 'Apartamento Zona Sul', type: 'IMOVEL', price: 250000, cat: 'imoveis' },
                    { title: 'Galpão Industrial', type: 'IMOVEL', price: 450000, cat: 'imoveis' }
                ]
            },
            {
                title: 'Leilão de Veículos',
                type: 'EXTRAJUDICIAL',
                status: 'ABERTO',
                daysOffset: 3,
                items: [
                    { title: 'Honda Civic 2020', type: 'VEICULO', price: 75000, cat: 'veiculos' },
                    { title: 'Toyota Corolla 2019', type: 'VEICULO', price: 65000, cat: 'veiculos' },
                    { title: 'Fiat Uno 2018', type: 'VEICULO', price: 45000, cat: 'veiculos' }
                ]
            }
        ];

        for (const auc of auctionsData) {
            const auction = await prisma.auction.create({
                data: {
                    publicId: `auction-${faker.string.alphanumeric(6)}`,
                    slug: slugify(auc.title) + '-' + timestamp,
                    title: auc.title,
                    description: `Descrição do ${auc.title}`,
                    status: auc.status as any,
                    auctionType: auc.type as any,
                    auctionDate: new Date(Date.now() + auc.daysOffset * 24 * 60 * 60 * 1000),
                    endDate: new Date(Date.now() + (auc.daysOffset + 7) * 24 * 60 * 60 * 1000),
                    tenantId: tenantId,
                    sellerId: sellerJudicial.id,
                    auctioneerId: auctioneerRecord.id,
                    address: 'Av. Paulista, 1000',
                    zipCode: '01310-100'
                }
            });

            // Create Stage
            await prisma.auctionStage.create({
                data: {
                    name: '1ª Praça',
                    auctionId: auction.id,
                    tenantId: tenantId,
                    startDate: auction.auctionDate,
                    endDate: auction.endDate,
                    status: 'AGUARDANDO_INICIO'
                }
            });

            // Create Lots
            let lotNum = 1;
            for (const item of auc.items) {
                const lot = await prisma.lot.create({
                    data: {
                        publicId: `lot-${faker.string.alphanumeric(6)}`,
                        auctionId: auction.id,
                        tenantId: tenantId,
                        number: `L${lotNum.toString().padStart(3, '0')}`,
                        title: item.title,
                        description: `Lote contendo ${item.title}`,
                        type: item.type as any,
                        price: new Prisma.Decimal(item.price),
                        initialPrice: new Prisma.Decimal(item.price * 0.8),
                        bidIncrementStep: new Prisma.Decimal(item.price * 0.01),
                        status: 'ABERTO_PARA_LANCES',
                        categoryId: categoriesMap[item.cat]?.id,
                        cityName: 'São Paulo',
                        stateUf: 'SP',
                        mapAddress: 'Av. Paulista, 1000'
                    }
                });

                // Create Asset for Lot
                await prisma.asset.create({
                    data: {
                        publicId: `asset-${faker.string.alphanumeric(6)}`,
                        title: item.title,
                        description: `Bem: ${item.title}`,
                        status: 'LOTEADO',
                        tenantId: tenantId,
                        sellerId: sellerJudicial.id,
                        evaluationValue: new Prisma.Decimal(item.price),
                        locationCity: 'São Paulo',
                        locationState: 'SP',
                        address: 'Av. Paulista, 1000',
                        dataAiHint: item.type
                    }
                });
                
                lotNum++;
            }
        }

        console.log('✅ Seed Completo Finalizado com Sucesso!');
        console.log('🔑 Credenciais:');
        console.log('   Admin/Leiloeiro: test.leiloeiro@bidexpert.com / Test@12345');
        console.log('   Analista: analista@lordland.com / password123');

    } catch (error) {
        console.error('❌ Erro Fatal no Seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

main();
