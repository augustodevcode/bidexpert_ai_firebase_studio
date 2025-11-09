import { faker } from '@faker-js/faker';
import { seedLogger } from './seed-logger';
import { SeedValidator, SeedValidationConfig } from './seed-validator';
import { TransactionManager } from './transaction-manager';
import { createConnectId, createConnectIds } from './types';
import { AssetStatus, PaymentStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Importing all needed services
import { UserService } from '../src/services/user.service';
import { CategoryService } from '../src/services/category.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { CityService } from '../src/services/city.service';
import { CourtService } from '../src/services/court.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { AssetService } from '../src/services/asset.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { BidService } from '../src/services/bid.service';
import { UserWinService } from '../src/services/user-win.service';
import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { MediaItemService } from '../src/services/media-item.service';
import { VehicleMakeService } from '../src/services/vehicle-make.service';
import { VehicleModelService } from '../src/services/vehicle-model.service';

// Initialize services
const services = {
    user: new UserService(),
    category: new CategoryService(),
    subcategory: new SubcategoryService(),
    city: new CityService(),
    court: new CourtService(),
    judicialDistrict: new JudicialDistrictService(),
    judicialBranch: new JudicialBranchService(),
    seller: new SellerService(),
    auctioneer: new AuctioneerService(),
    asset: new AssetService(),
    auction: new AuctionService(),
    lot: new LotService(),
    bid: new BidService(),
    userWin: new UserWinService(),
    installmentPayment: new InstallmentPaymentService(),
    mediaItem: new MediaItemService(),
    vehicleMake: new VehicleMakeService(),
    vehicleModel: new VehicleModelService()
};

async function createCategories() {
    seedLogger.info("Criando categorias...");
    
    const categories = [
        { name: 'Veículos', description: 'Carros, motos e outros veículos' },
        { name: 'Imóveis', description: 'Casas, apartamentos e terrenos' },
        { name: 'Equipamentos', description: 'Equipamentos industriais e profissionais' },
        { name: 'Eletrônicos', description: 'Computadores, celulares e outros eletrônicos' }
    ];

    for (const category of categories) {
        try {
            await services.category.create(category);
            seedLogger.info(`✓ Categoria criada: ${category.name}`);
        } catch (error) {
            console.error(`Erro ao criar categoria ${category.name}:`, error);
            throw error;
        }
    }
}

async function createSubcategories() {
    seedLogger.info("Criando subcategorias...");
    
    const subcategories = [
        { categoryId: 1, name: 'Carros', description: 'Automóveis de passeio' },
        { categoryId: 1, name: 'Motos', description: 'Motocicletas' },
        { categoryId: 1, name: 'Caminhões', description: 'Veículos de carga' },
        { categoryId: 2, name: 'Casas', description: 'Residências unifamiliares' },
        { categoryId: 2, name: 'Apartamentos', description: 'Unidades em condomínio' },
        { categoryId: 2, name: 'Terrenos', description: 'Lotes e terrenos' },
        { categoryId: 3, name: 'Máquinas Industriais', description: 'Equipamentos para indústria' },
        { categoryId: 3, name: 'Ferramentas', description: 'Ferramentas profissionais' },
        { categoryId: 4, name: 'Computadores', description: 'Desktops e notebooks' },
        { categoryId: 4, name: 'Smartphones', description: 'Telefones celulares' }
    ];

    for (const subcategory of subcategories) {
        try {
            await services.subcategory.create({
                name: subcategory.name,
                description: subcategory.description,
                categoryId: BigInt(subcategory.categoryId)
            });
            seedLogger.info(`✓ Subcategoria criada: ${subcategory.name}`);
        } catch (error) {
            console.error(`Erro ao criar subcategoria ${subcategory.name}:`, error);
            throw error;
        }
    }
}

async function createVehicleMakesAndModels() {
    seedLogger.info("Criando marcas e modelos de veículos...");
    
    const makes = [
        { name: 'Toyota', country: 'Japão' },
        { name: 'Volkswagen', country: 'Alemanha' },
        { name: 'Ford', country: 'Estados Unidos' },
        { name: 'Honda', country: 'Japão' },
        { name: 'Chevrolet', country: 'Estados Unidos' }
    ];

    for (const make of makes) {
        try {
            const createdMake = await services.vehicleMake.create(make);
            
            // Create models for each make
            const models = [
                { makeId: createdMake.id, name: `${make.name} Modelo A`, year: 2020 },
                { makeId: createdMake.id, name: `${make.name} Modelo B`, year: 2021 },
                { makeId: createdMake.id, name: `${make.name} Modelo C`, year: 2022 }
            ];

            for (const model of models) {
                await services.vehicleModel.create(model);
            }

            seedLogger.info(`✓ Marca e modelos criados: ${make.name}`);
        } catch (error) {
            console.error(`Erro ao criar marca/modelos ${make.name}:`, error);
            throw error;
        }
    }
}

async function createCities() {
    seedLogger.info("Criando cidades...");
    
    const cities = [
        { name: 'São Paulo', stateUf: 'SP' },
        { name: 'Rio de Janeiro', stateUf: 'RJ' },
        { name: 'Belo Horizonte', stateUf: 'MG' },
        { name: 'Porto Alegre', stateUf: 'RS' },
        { name: 'Curitiba', stateUf: 'PR' }
    ];

    for (const city of cities) {
        try {
            await services.city.create(city);
            seedLogger.info(`✓ Cidade criada: ${city.name}`);
        } catch (error) {
            console.error(`Erro ao criar cidade ${city.name}:`, error);
            throw error;
        }
    }
}

async function createJudicialEntities() {
    seedLogger.info("Criando entidades judiciais...");
    
    // Create judicial branches
    const branches = [
        { name: 'Justiça Federal' },
        { name: 'Justiça Estadual' },
        { name: 'Justiça do Trabalho' }
    ];

    for (const branch of branches) {
        try {
            await services.judicialBranch.create(branch);
        } catch (error) {
            console.error(`Erro ao criar vara judicial ${branch.name}:`, error);
            throw error;
        }
    }

    // Create courts
    const courts = [
        { name: '1ª Vara Federal', cityId: BigInt(1), judicialBranchId: BigInt(1) },
        { name: '2ª Vara Estadual', cityId: BigInt(2), judicialBranchId: BigInt(2) },
        { name: '3ª Vara do Trabalho', cityId: BigInt(3), judicialBranchId: BigInt(3) }
    ];

    for (const court of courts) {
        try {
            await services.court.create(court);
        } catch (error) {
            console.error(`Erro ao criar tribunal ${court.name}:`, error);
            throw error;
        }
    }

    // Create judicial districts
    const districts = [
        { name: 'Distrito Federal 1', cityId: BigInt(1) },
        { name: 'Distrito Estadual 1', cityId: BigInt(2) },
        { name: 'Distrito do Trabalho 1', cityId: BigInt(3) }
    ];

    for (const district of districts) {
        try {
            await services.judicialDistrict.create(district);
        } catch (error) {
            console.error(`Erro ao criar distrito judicial ${district.name}:`, error);
            throw error;
        }
    }
}

async function createSampleMediaItems() {
    seedLogger.info("Criando itens de mídia de exemplo...");
    
    const mediaItems = [
        { 
            name: 'Foto Carro 1',
            mimeType: 'image/jpeg',
            size: 1024,
            url: 'https://example.com/car1.jpg',
            thumbnailUrl: 'https://example.com/car1-thumb.jpg'
        },
        {
            name: 'Foto Casa 1',
            mimeType: 'image/jpeg',
            size: 2048,
            url: 'https://example.com/house1.jpg',
            thumbnailUrl: 'https://example.com/house1-thumb.jpg'
        }
    ];

    for (const item of mediaItems) {
        try {
            await services.mediaItem.create(item);
            seedLogger.info(`✓ Item de mídia criado: ${item.name}`);
        } catch (error) {
            console.error(`Erro ao criar item de mídia ${item.name}:`, error);
            throw error;
        }
    }
}

async function seedExtendedData() {
    try {
        seedLogger.info("Iniciando seed de dados estendidos...");

        await createCategories();
        await createSubcategories();
        await createVehicleMakesAndModels();
        await createCities();
        await createJudicialEntities();
        await createSampleMediaItems();

        // TODO: Implement remaining seeding functions using services
        // - Create users
        // - Create assets
        // - Create auctions
        // - Create lots
        // - Create bids
        // - Create user wins
        // - Create installment payments

        seedLogger.info("Seed de dados estendidos concluído com sucesso!");
    } catch (error) {
        console.error("Erro durante o seed de dados estendidos:", error);
        throw error;
    }
}

// Export the seed function
export { seedExtendedData };