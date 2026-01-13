
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Home V2 Data...');

    // 0. Ensure Tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'BidExpert Default',
                subdomain: 'demo',
                domain: 'demo.bidexpert.com'
            }
        });
    }
    const tenantId = tenant.id;


    // 1. Ensure Seller
    let seller = await prisma.seller.findFirst({ where: { name: 'Vendedor Exemplar V2' } });
    if (!seller) {
        seller = await prisma.seller.create({
            data: {
                name: 'Vendedor Exemplar V2',
                slug: 'vendedor-exemplar-v2',
                publicId: `seller-v2-${Date.now()}`,
                email: 'vendedor.v2@exemplo.com',
                logoUrl: 'https://placehold.co/200x200.png',
                tenantId: tenantId,
            }
        });
    }

    // 2. Ensure Categories
    const categoriesData = [
        { name: 'Veículos' },
        { name: 'Imóveis' }
    ];

    const categories: Record<string, any> = {};

    for (const catData of categoriesData) {
        let cat = await prisma.lotCategory.findFirst({ where: { name: catData.name } });
        if (!cat) {
            cat = await prisma.lotCategory.create({
                data: {
                    name: catData.name,
                    slug: catData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                    description: `Categoria ${catData.name}`,
                    tenantId: tenantId
                }
            });
        }
        categories[catData.name] = cat;
    }

    // 3. Create Auction
    const auction = await prisma.auction.create({
        data: {
            title: 'Leilão Premium Home V2 ' + Date.now(),
            publicId: `AUC-V2-${Math.floor(Math.random() * 10000)}`,
            slug: `leilao-premium-home-v2-${Date.now()}`,
            status: 'ABERTO_PARA_LANCES',
            auctionDate: addDays(new Date(), 5),
            endDate: addDays(new Date(), 10),
            auctionType: 'EXTRAJUDICIAL', // Fixed enum
            sellerId: seller.id,
            tenantId: tenantId,
            description: 'Leilão de teste para validação da Home V2',
            stages: {
                create: [
                    {
                        name: '1ª Praça',
                        startDate: addDays(new Date(), 1),
                        endDate: addDays(new Date(), 3),
                        status: 'AGUARDANDO_INICIO',
                        discountPercent: 0,
                        tenantId: tenantId
                    },
                    {
                        name: '2ª Praça',
                        startDate: addDays(new Date(), 3),
                        endDate: addDays(new Date(), 10),
                        status: 'AGUARDANDO_INICIO',
                        discountPercent: 40,
                        tenantId: tenantId
                    }
                ]
            }
        }
    });

    console.log(`Auction created: ${auction.id}`);

    // 4. Create Lots & Assets
    // Lot 1: Vehicle
    const vehicleAsset = await prisma.asset.create({
        data: {
            title: 'BMW X1 2024 - Ativo',
            publicId: `AST-VEIC-${Date.now()}`,
            description: 'Veículo em perfeito estado.',
            status: 'DISPONIVEL',
            categoryId: categories['Veículos'].id,
            sellerId: seller.id,
            tenantId: tenantId,
            imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
            make: 'BMW',
            model: 'X1',
            year: 2024,
            mileage: 15000,
            color: 'Branco',
            fuelType: 'Gasolina'
        }
    });

    await prisma.lot.create({
        data: {
            title: 'BMW X1 2024 - Destaque V2',
            number: '001',
            publicId: `LOT-V2-VEIC-${Date.now()}`,
            status: 'ABERTO_PARA_LANCES',
            type: 'EXTRAJUDICIAL',
            price: 150000.00,
            initialPrice: 150000.00,
            bidIncrementStep: 1000.00,
            description: 'Veículo em perfeito estado, laudo aprovado.',
            auctionId: auction.id,
            categoryId: categories['Veículos'].id,
            imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
            isFeatured: true,
            condition: 'Novo',
            bidsCount: 5,
            tenantId: tenantId,
            assets: {
                create: {
                    assetId: vehicleAsset.id,
                    tenantId: tenantId,
                    assignedBy: 'SEED'
                }
            }
        }
    });

    // Lot 2: Real Estate
    const realEstateAsset = await prisma.asset.create({
        data: {
            title: 'Apartamento Jardins - Ativo',
            publicId: `AST-IMOV-${Date.now()}`,
            description: 'Apartamento de alto padrão.',
            status: 'DISPONIVEL',
            categoryId: categories['Imóveis'].id,
            sellerId: seller.id,
            tenantId: tenantId,
            imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
            locationCity: 'São Paulo',
            locationState: 'SP',
            totalArea: 150,
            bedrooms: 3,
            parkingSpaces: 2
        }
    });

    await prisma.lot.create({
        data: {
            title: 'Apartamento Jardins - Destaque V2',
            number: '002',
            publicId: `LOT-V2-IMOV-${Date.now()}`,
            status: 'ABERTO_PARA_LANCES',
            type: 'EXTRAJUDICIAL',
            price: 800000.00,
            initialPrice: 800000.00,
            bidIncrementStep: 5000.00,
            description: 'Apartamento de alto padrão, documentação ok.',
            auctionId: auction.id,
            categoryId: categories['Imóveis'].id,
            imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
            isFeatured: true,
            condition: 'Ocupado',
            bidsCount: 2,
            tenantId: tenantId,
            assets: {
                create: {
                    assetId: realEstateAsset.id,
                    tenantId: tenantId,
                    assignedBy: 'SEED'
                }
            }
        }
    });

    // Lot 3: Real Estate 2 (Casa)
    const houseAsset = await prisma.asset.create({
        data: {
            title: 'Casa Luxo Morumbi - Ativo',
            publicId: `AST-IMOV2-${Date.now()}`,
            description: 'Casa Luxo Morumbi.',
            status: 'DISPONIVEL',
            categoryId: categories['Imóveis'].id,
            sellerId: seller.id,
            tenantId: tenantId,
            imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80', // Using same image for now or random
            locationCity: 'São Paulo',
            locationState: 'SP',
            totalArea: 750,
            bedrooms: 5,
            parkingSpaces: 4
        }
    });

    await prisma.lot.create({
        data: {
            title: 'Casa Luxo Morumbi',
            number: '003',
            publicId: `LOT-V2-IMOV2-${Date.now()}`,
            status: 'ABERTO_PARA_LANCES',
            type: 'EXTRAJUDICIAL',
            price: 500000.00,
            initialPrice: 500000.00,
            bidIncrementStep: 5000.00,
            description: 'Casa Luxo Morumbi',
            auctionId: auction.id,
            categoryId: categories['Imóveis'].id,
            imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
            isFeatured: true,
            condition: 'Ocupado',
            bidsCount: 50,
            tenantId: tenantId,
            assets: {
                create: {
                    assetId: houseAsset.id,
                    tenantId: tenantId,
                    assignedBy: 'SEED'
                }
            }
        }
    });

    console.log('Seed completed successfully for Home V2.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
