
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
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { ReportService } from '../src/services/report.service';
import { DocumentTemplateService } from '../src/services/document-template.service';
import { VisitorTrackingService } from '../src/services/visitor-tracking.service';
import { CourtService } from '../src/services/court.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { AssetService } from '../src/services/asset.service';
import { BidService } from '../src/services/bid.service';
import { BidderService } from '../src/services/bidder.service';
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
    seller: new SellerService(),
    auctioneer: new AuctioneerService(),
    auction: new AuctionService(),
    lot: new LotService(),
    report: new ReportService(),
    documentTemplate: new DocumentTemplateService(prisma),
    visitorTracking: new VisitorTrackingService(),
    court: new CourtService(),
    judicialDistrict: new JudicialDistrictService(),
    judicialBranch: new JudicialBranchService(),
    asset: new AssetService(),
    bid: new BidService(),
    bidder: new BidderService(),
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
        await prisma.report.deleteMany({});
        await prisma.auctioneer.deleteMany({});
        await prisma.seller.deleteMany({});
        await prisma.visitorEvent.deleteMany({});
        await prisma.visitorSession.deleteMany({});
        await prisma.visitor.deleteMany({});

        // Level 3: Tables with dependencies on Level 2
        await prisma.auction.deleteMany({});
        await prisma.asset.deleteMany({});
        await prisma.judicialProcess.deleteMany({});
        await prisma.userDocument.deleteMany({});

        // Level 4: Tables with dependencies on Level 3
        await prisma.usersOnRoles.deleteMany({});
        await prisma.usersOnTenants.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.documentTemplate.deleteMany({});
        await prisma.platformSettings.deleteMany({});

        // Level 5: Base tables with minimal dependencies
        // Note: We keep Roles and Tenants usually, but for a "Complete" seed we might want to ensure they are fresh or just upsert them.
        // v4 deletes them. v3 kept them. Let's follow v4's clean slate approach but be careful.
        // If we delete Roles, we must recreate ALL of them.
        await prisma.role.deleteMany({});
        await prisma.tenant.deleteMany({});
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
            { role: 'ADMIN', email: 'admin@bidexpert.com', name: 'Administrador Geral', extraRoles: [] },
            { role: 'LEILOEIRO', email: 'test.leiloeiro@bidexpert.com', name: 'Leiloeiro Test Premium', extraRoles: ['COMPRADOR', 'ADMIN'] },
            { role: 'BIDDER', email: 'test.comprador@bidexpert.com', name: 'Comprador Test', extraRoles: [] },
            { role: 'ADVOGADO', email: 'advogado@bidexpert.com.br', name: 'Dr. Advogado Test', extraRoles: ['COMPRADOR'] },
            { role: 'VENDEDOR', email: 'test.vendedor@bidexpert.com', name: 'Vendedor Test', extraRoles: ['COMPRADOR'] },
            { role: 'AVALIADOR', email: 'test.avaliador@bidexpert.com', name: 'Avaliador Test', extraRoles: [] },
            { role: 'AUCTION_ANALYST', email: 'analista@lordland.com', name: 'Analista de Leilões Lordland', extraRoles: [], password: 'password123' } // Specific password for analyst
        ];

        const usersMap: Record<string, any> = {};

        for (const u of usersConfig) {
            const roleIds: string[] = [];
            if (rolesMap[u.role]) roleIds.push(rolesMap[u.role].id.toString());
            for (const extra of u.extraRoles) {
                if (rolesMap[extra]) roleIds.push(rolesMap[extra].id.toString());
            }

            const result = await services.user.createUser({
                email: u.email,
                password: u.password || 'Test@12345',
                fullName: u.name,
                cpf: faker.string.numeric(11),
                roleIds: roleIds,
                tenantId: tenantIdStr,
                habilitationStatus: 'HABILITADO'
            } as any); // Cast to any to allow habilitationStatus if not in type definition

            if (result.success && result.userId) {
                const user = await prisma.user.findUnique({ where: { id: BigInt(result.userId) } });
                if (user) usersMap[u.role] = user;
            } else {
                console.error(`Failed to create user ${u.email}: ${result.message}`);
            }
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
                    } as any);
                }
            }
        }

        // 6. JUDICIAL STRUCTURE
        console.log('⚖️ Criando Estrutura Judicial...');
        const courtResult = await services.court.createCourt({
            name: 'Tribunal de Justiça de São Paulo',
            stateUf: 'SP',
            website: 'https://www.tjsp.jus.br',
        });
        const court = await prisma.court.findUnique({ where: { id: BigInt(courtResult.courtId!) } });
        if (!court) throw new Error("Failed to create court");

        const districtResult = await services.judicialDistrict.createJudicialDistrict({
            name: `Comarca de São Paulo`,
            courtId: court.id.toString(),
            zipCode: '01000-000'
        });
        const district = await prisma.judicialDistrict.findUnique({ where: { id: BigInt(districtResult.districtId!) } });
        if (!district) throw new Error("Failed to create district");

        const branchResult = await services.judicialBranch.createJudicialBranch({
            name: `1ª Vara Cível da Capital`,
            districtId: district.id.toString(),
            contactName: 'Dr. João Silva',
            phone: '(11) 3133-1000',
            email: 'vara.civel@tjsp.jus.br',
        });
        const branch = await prisma.judicialBranch.findUnique({ where: { id: BigInt(branchResult.branchId!) } });
        if (!branch) throw new Error("Failed to create branch");

        // 7. SELLERS & AUCTIONEERS
        console.log('👨‍💼 Criando Sellers e Auctioneers...');
        
        // Judicial Seller
        const sellerResult = await services.seller.createSeller(tenantIdStr, {
            name: `Leiloeiro Judicial SP`,
            description: 'Leiloeiro autorizado pelo TJSP',
            judicialBranchId: branch.id.toString(),
            logoUrl: `https://placehold.co/400x400/1e293b/ffffff?text=TJSP+Leilões`,
            dataAiHintLogo: 'Logo oficial do Leiloeiro Judicial SP'
        } as any);
        
        const sellerJudicial = await prisma.seller.findUnique({ where: { id: BigInt(sellerResult.sellerId!) } });
        if (!sellerJudicial) throw new Error("Failed to create seller");

        // Auctioneer Record (linked to the user created above)
        const auctioneerResult = await services.auctioneer.createAuctioneer(tenantIdStr, {
            name: 'Leiloeiro Principal',
            userId: usersMap['LEILOEIRO'].id.toString(),
            logoUrl: `https://placehold.co/400x400/2563eb/ffffff?text=Leiloeiro+Principal`,
            dataAiHintLogo: 'Logo do Leiloeiro Principal'
        } as any);

        const auctioneerRecord = await prisma.auctioneer.findUnique({ where: { id: BigInt(auctioneerResult.auctioneerId!) } });
        if (!auctioneerRecord) throw new Error("Failed to create auctioneer");

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
            },
            {
                title: 'Tomada de Preços - Equipamentos',
                type: 'TOMADA_DE_PRECOS',
                status: 'ENCERRADO', // Closed auction to have winners
                daysOffset: -5, // Ended 5 days ago
                items: [
                    { title: 'Lote de Notebooks Dell', type: 'MAQUINARIO', price: 25000, cat: 'informatica' },
                    { title: 'Servidor Rack 4U', type: 'MAQUINARIO', price: 15000, cat: 'informatica' }
                ]
            }
        ];

        const createdLots: any[] = [];

        for (const auc of auctionsData) {
            const startDate = new Date(Date.now() + auc.daysOffset * 24 * 60 * 60 * 1000);
            const endDate = new Date(Date.now() + (auc.daysOffset + 7) * 24 * 60 * 60 * 1000);

            const auctionResult = await services.auction.createAuction(tenantIdStr, {
                title: auc.title,
                description: `Descrição do ${auc.title}`,
                auctionType: auc.type as any,
                sellerId: sellerJudicial.id.toString(),
                auctioneerId: auctioneerRecord.id.toString(),
                address: 'Av. Paulista, 1000',
                zipCode: '01310-100',
                auctionStages: [{
                    name: '1ª Praça',
                    startDate: startDate,
                    endDate: endDate,
                    status: auc.status === 'ENCERRADO' ? 'CONCLUIDO' : 'AGUARDANDO_INICIO'
                }]
            } as any);

            if (!auctionResult.success || !auctionResult.auctionId) {
                console.error(`Failed to create auction ${auc.title}: ${auctionResult.message}`);
                continue;
            }

            // Update status and dates via Prisma (God Mode)
            const auction = await prisma.auction.update({
                where: { id: BigInt(auctionResult.auctionId) },
                data: {
                    status: auc.status as any,
                    auctionDate: startDate,
                    endDate: endDate
                }
            });

            // Create Lots
            let lotNum = 1;
            for (const item of auc.items) {
                // Create Asset first
                const assetResult = await services.asset.createAsset(tenantIdStr, {
                    title: item.title,
                    description: `Bem: ${item.title}`,
                    sellerId: sellerJudicial.id.toString(),
                    evaluationValue: item.price,
                    categoryId: categoriesMap[item.cat]?.id.toString(),
                    street: 'Av. Paulista',
                    number: '1000',
                    neighborhood: 'Centro',
                    zipCode: '01310-100',
                    dataAiHint: item.type
                } as any);

                const asset = await prisma.asset.findUnique({ where: { id: BigInt(assetResult.assetId!) } });
                if (!asset) throw new Error("Failed to create asset");

                const lotResult = await services.lot.createLot({
                    auctionId: auction.id.toString(),
                    number: `L${lotNum.toString().padStart(3, '0')}`,
                    title: item.title,
                    description: `Lote contendo ${item.title}`,
                    type: item.type as any,
                    price: item.price,
                    initialPrice: item.price * 0.8,
                    bidIncrementStep: item.price * 0.01,
                    categoryId: categoriesMap[item.cat]?.id.toString(),
                    cityName: 'São Paulo',
                    stateUf: 'SP',
                    mapAddress: 'Av. Paulista, 1000',
                    assetIds: [asset.id.toString()]
                } as any, tenantIdStr);

                if (lotResult.success && lotResult.lotId) {
                    const lot = await prisma.lot.update({
                        where: { id: BigInt(lotResult.lotId) },
                        data: {
                            status: auc.status === 'ENCERRADO' ? 'VENDIDO' : 'ABERTO_PARA_LANCES'
                        }
                    });
                    createdLots.push(lot);
                }
                
                lotNum++;
            }
        }

        // 9. BIDS & WINNERS & PAYMENTS
        console.log('💰 Criando Lances, Vencedores e Pagamentos...');
        
        const bidderUser = usersMap['BIDDER'];
        const lawyerUser = usersMap['ADVOGADO'];

        // Ensure Bidder Profile exists for WonLot linkage
        const bidderProfile = await services.bidder.getOrCreateBidderProfile(bidderUser.id);

        // 9.1 Create Bids for Open Lots
        const openLots = createdLots.filter(l => l.status === 'ABERTO_PARA_LANCES');
        for (const lot of openLots) {
            // Bidder 1
            await services.bid.createBid({
                lot: { connect: { id: lot.id } },
                auction: { connect: { id: lot.auctionId } },
                bidder: { connect: { id: bidderUser.id } },
                tenant: { connect: { id: tenantId } },
                amount: new Prisma.Decimal(Number(lot.initialPrice) + 1000),
                bidderDisplay: 'Comprador Test'
            });
            
            // Bidder 2 (Lawyer)
            await services.bid.createBid({
                lot: { connect: { id: lot.id } },
                auction: { connect: { id: lot.auctionId } },
                bidder: { connect: { id: lawyerUser.id } },
                tenant: { connect: { id: tenantId } },
                amount: new Prisma.Decimal(Number(lot.initialPrice) + 2000),
                bidderDisplay: 'Dr. Advogado'
            });
        }

        // 9.2 Create Winners for Closed Lots (Tomada de Preços)
        const soldLots = createdLots.filter(l => l.status === 'VENDIDO');
        for (const lot of soldLots) {
            const winningAmount = Number(lot.price);
            
            // Create Winning Bid
            await services.bid.createBid({
                lot: { connect: { id: lot.id } },
                auction: { connect: { id: lot.auctionId } },
                bidder: { connect: { id: bidderUser.id } },
                tenant: { connect: { id: tenantId } },
                amount: new Prisma.Decimal(winningAmount),
                bidderDisplay: 'Comprador Vencedor',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            });

            // Update Lot Winner
            await prisma.lot.update({
                where: { id: lot.id },
                data: { winnerId: bidderUser.id, endDate: new Date() }
            });

            // Create UserWin
            const userWin = await prisma.userWin.create({
                data: {
                    lotId: lot.id,
                    userId: bidderUser.id,
                    winningBidAmount: new Prisma.Decimal(winningAmount),
                    paymentStatus: 'PENDENTE',
                    retrievalStatus: 'PENDENTE',
                    tenantId: tenantId
                }
            });

            // Create Installment Payment (Pending)
            await prisma.installmentPayment.create({
                data: {
                    userWinId: userWin.id,
                    installmentNumber: 1,
                    totalInstallments: 1,
                    amount: new Prisma.Decimal(winningAmount),
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
                    status: 'PENDENTE',
                    tenantId: tenantId
                }
            });

            // Create WonLot (Dashboard View)
            await prisma.wonLot.create({
                data: {
                    bidderId: bidderProfile.id,
                    lotId: lot.id,
                    auctionId: lot.auctionId,
                    title: lot.title,
                    finalBid: new Prisma.Decimal(winningAmount),
                    status: 'WON',
                    paymentStatus: 'PENDENTE',
                    totalAmount: new Prisma.Decimal(winningAmount * 1.05), // +5% fee
                    tenantId: tenantId,
                    invoiceUrl: `https://placehold.co/600x800/ffffff/000000?text=Invoice+${lot.number}`,
                    receiptUrl: null
                }
            });
        }

        // 10. DIRECT SALES (SOLD)
        console.log('🏷️ Criando Vendas Diretas (Realizadas)...');
        await prisma.directSaleOffer.create({
            data: {
                publicId: `offer-${timestamp}-sold`,
                title: 'Terreno Vendido - Oportunidade',
                description: 'Terreno vendido via venda direta.',
                offerType: 'BUY_NOW',
                price: new Prisma.Decimal(180000),
                minimumOfferPrice: new Prisma.Decimal(170000),
                status: 'SOLD',
                locationCity: 'São Paulo',
                locationState: 'SP',
                categoryId: categoriesMap['imoveis']?.id,
                sellerId: sellerJudicial.id,
                tenantId: tenantId,
                itemsIncluded: ['Escritura'],
                sellerLogoUrl: sellerJudicial.logoUrl
            }
        });

        // 11. REPORTS & TEMPLATES
        console.log('📄 Criando Relatórios e Templates...');
        
        // Template
        await services.documentTemplate.createDocumentTemplate({
            name: 'Auto de Arrematação Padrão',
            type: 'WINNING_BID_TERM',
            content: '<h1>Auto de Arrematação</h1><p>Certificamos que o lote {{lotTitle}} foi arrematado por {{winnerName}}.</p>'
        } as any);

        // Report
        await services.report.createReport({
            name: 'Relatório de Vendas Mensal',
            description: 'Vendas realizadas no mês corrente',
            definition: { type: 'SALES', period: 'MONTHLY' },
            createdById: usersMap['ADMIN'].id.toString()
        }, tenantIdStr);

        // 12. VISITS (Visitor Events)
        console.log('👀 Criando Registros de Visitas...');
        
        const visitorId = `visitor-${faker.string.uuid()}`;
        const { visitor } = await services.visitorTracking.getOrCreateVisitor(visitorId);
        
        const { session } = await services.visitorTracking.getOrCreateSession(
            visitor.id,
            faker.internet.userAgent(),
            faker.internet.ipv4()
        );

        for (const lot of createdLots) {
            // Simulate 5 visits per lot
            for (let i = 0; i < 5; i++) {
                await services.visitorTracking.trackEvent(
                    visitor.id,
                    session.id,
                    'LOT_VIEW',
                    'Lot',
                    lot.id,
                    lot.publicId,
                    `/lotes/${lot.slug || lot.id}`
                );
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
