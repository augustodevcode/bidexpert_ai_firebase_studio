import { faker } from '@faker-js/faker';
import { seedLogger } from './seed-logger';
import { SeedValidator, SeedValidationConfig } from './seed-validator';
import { TransactionManager } from './transaction-manager';
import { createConnectId, createConnectIds } from './types';
import { AssetStatus, PaymentStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createServiceExtensions } from './service-extensions';
import { prisma } from '../src/lib/prisma';

// Import services individually to avoid path issues
import { TenantService } from '../src/services/tenant.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { MentalTriggerSettingsService } from '../src/services/mental-trigger-settings.service';
import { UserService } from '../src/services/user.service';
import { RoleService } from '../src/services/role.service';
import { StateService } from '../src/services/state.service';
import { CityService } from '../src/services/city.service';
import { CourtService } from '../src/services/court.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { AssetService } from '../src/services/asset.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { BidService } from '../src/services/bid.service';
import { UserWinService } from '../src/services/user-win.service';
import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { DocumentTypeService } from '../src/services/document-type.service';
import { UserDocumentService } from '../src/services/user-document.service';
import { MediaItemService } from '../src/services/media-item.service';
import { VehicleMakeService } from '../src/services/vehicle-make.service';
import { VehicleModelService } from '../src/services/vehicle-model.service';

// Initialize services
const services = {
    tenant: new TenantService(),
    platformSettings: new PlatformSettingsService(),
    mentalTriggerSettings: new MentalTriggerSettingsService(),
    user: new UserService(),
    role: new RoleService(),
    state: new StateService(),
    city: new CityService(),
    court: new CourtService(),
    judicialDistrict: new JudicialDistrictService(),
    judicialBranch: new JudicialBranchService(),
    seller: new SellerService(),
    auctioneer: new AuctioneerService(),
    category: new CategoryService(),
    subcategory: new SubcategoryService(),
    asset: new AssetService(),
    auction: new AuctionService(),
    lot: new LotService(),
    bid: new BidService(),
    userWin: new UserWinService(),
    installmentPayment: new InstallmentPaymentService(),
    documentType: new DocumentTypeService(),
    userDocument: new UserDocumentService(),
    mediaItem: new MediaItemService(),
    vehicleMake: new VehicleMakeService(),
    vehicleModel: new VehicleModelService()
};

async function cleanDatabase() {
    console.log("Limpando banco de dados...");
    
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

        // Level 2: Tables with dependencies on Level 1
        await prisma.lot.deleteMany({});
        await prisma.auctionHabilitation.deleteMany({});
        await prisma.auctionStage.deleteMany({});
        await prisma.directSaleOffer.deleteMany({});

        // Level 3: Tables with dependencies on Level 2
        await prisma.auction.deleteMany({});
        await prisma.asset.deleteMany({});
        await prisma.judicialProcess.deleteMany({});
        await prisma.userDocument.deleteMany({});

        // Level 4: Tables with dependencies on Level 3
        await prisma.usersOnRoles.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.seller.deleteMany({});
        await prisma.auctioneer.deleteMany({});
        await prisma.report.deleteMany({});

        // Level 5: Base tables with minimal dependencies
        await prisma.role.deleteMany({});
        await prisma.subcategory.deleteMany({});
        await prisma.lotCategory.deleteMany({});
        await prisma.vehicleModel.deleteMany({});
        await prisma.vehicleMake.deleteMany({});
        await prisma.court.deleteMany({});
        await prisma.city.deleteMany({});
        await prisma.state.deleteMany({});
        await prisma.documentType.deleteMany({});
        await prisma.mediaItem.deleteMany({});
        
        console.log("✓ Database cleaned successfully");
    } catch (error) {
        console.error("Error cleaning database:", error);
        throw error;
    }
}

async function createMainTenant() {
    seedLogger.info("Criando tenant principal...");
    
    try {
        const { tenant } = await services.tenant.createTenant({
            name: 'BidExpert Main',
            subdomain: 'main'
        });

        if (!tenant) {
            throw new Error("Falha ao criar tenant principal");
        }

        // Configurando platform settings usando o serviço
        await services.platformSettings.updateSettings(tenant.id.toString(), {
            siteTitle: 'BidExpert',
            siteTagline: 'Plataforma de Leilões',
            isSetupComplete: true
        });

        return tenant;
    } catch (error) {
        console.error("Erro ao criar tenant principal:", error);
        throw error;
    }
}

async function createRoles() {
    seedLogger.info("Criando roles essenciais...");
    
    const essentialRoles = [
        { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', description: 'Administrador do sistema', permissions: ['manage_all'] },
        { name: 'Bidder', nameNormalized: 'BIDDER', description: 'Arrematante', permissions: ['bid:create', 'bid:read'] },
        { name: 'Auctioneer', nameNormalized: 'AUCTIONEER', description: 'Leiloeiro', permissions: ['auction:create', 'auction:update'] },
        { name: 'Seller', nameNormalized: 'SELLER', description: 'Comitente', permissions: ['lot:create', 'lot:update'] }
    ];

    for (const role of essentialRoles) {
        try {
            await services.role.createRole(role);
        } catch (error) {
            console.error("Erro ao criar role:", role.name, error);
            throw error;
        }
    }
}

async function createStates() {
    seedLogger.info("Criando estados...");
    
    const brazilianStates = [
        { name: 'São Paulo', uf: 'SP' },
        { name: 'Rio de Janeiro', uf: 'RJ' },
        { name: 'Minas Gerais', uf: 'MG' },
        { name: 'Rio Grande do Sul', uf: 'RS' },
        { name: 'Paraná', uf: 'PR' }
    ];

    for (const state of brazilianStates) {
        try {
            await services.state.createState(state);
        } catch (error) {
            console.error("Erro ao criar estado:", state.name, error);
            throw error;
        }
    }
}

async function createCategories() {
    seedLogger.info("Criando categorias...");
    
    const categories = [
        { name: 'Imóveis', description: 'Casas, apartamentos e terrenos' },
        { name: 'Veículos', description: 'Carros, motos e outros veículos' },
        { name: 'Eletrônicos', description: 'Computadores, celulares e outros eletrônicos' }
    ];

    const createdCategories = [];
    for (const category of categories) {
        try {
            const result = await services.category.createCategory(category);
            if (result.success && result.category) {
                createdCategories.push(result.category);
            }
        } catch (error) {
            console.error("Erro ao criar categoria:", category.name, error);
            throw error;
        }
    }
    return createdCategories;
}

async function createSubcategories(categories: any[]) {
    seedLogger.info("Criando subcategorias...");
    
    const subcategories = [
        { categoryId: categories[0].id, name: 'Apartamentos', description: 'Unidades em condomínio' },
        { categoryId: categories[0].id, name: 'Casas', description: 'Residências unifamiliares' },
        { categoryId: categories[1].id, name: 'Carros', description: 'Automóveis de passeio' },
        { categoryId: categories[1].id, name: 'Motos', description: 'Motocicletas' }
    ];

    for (const subcategory of subcategories) {
        try {
            await services.subcategory.createSubcategory({
                name: subcategory.name,
                parentCategoryId: subcategory.categoryId,
                description: subcategory.description,
                displayOrder: 0,
                iconUrl: '',
                iconMediaId: null,
                dataAiHintIcon: ''
            });
        } catch (error) {
            console.error("Erro ao criar subcategoria:", subcategory.name, error);
            throw error;
        }
    }
}

async function main() {
    try {
        seedLogger.info("Iniciando processo de seed estendido v4...");

        await cleanDatabase();
        
        const tenant = await createMainTenant();
        if (!tenant) {
            throw new Error("Falha ao criar tenant principal");
        }

        const tenantId = tenant.id.toString();

        await createRoles();
        await createStates();
        
        const categories = await createCategories();
        await createSubcategories(categories);

        seedLogger.info("Processo de seed concluído com sucesso!");
    } catch (error) {
        console.error("Erro durante o processo de seed:", error);
        process.exit(1);
    }
}

// Execute o script
main();