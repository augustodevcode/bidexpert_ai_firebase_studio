
import prisma from '@/lib/prisma';

async function seedMapSearchData() {
  console.log('🌱 Starting map search test data seed (APPEND ONLY)...');

  try {
    // 1. Get Default Tenant (ID 1)
    let tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    if (!tenant) {
      console.log('📍 Tenant 1 not found, trying "test" subdomain...');
      tenant = await prisma.tenant.findFirst({
        where: { subdomain: 'test' }
      });
    }

    if (!tenant) {
      console.log('📍 Creating test tenant...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          subdomain: 'test',
        },
      });
    }
    console.log(`✅ Using tenant: ${tenant.id}`);

    // 2. Get or Create Category
    let category = await prisma.lotCategory.findFirst({
      where: { slug: 'imoveis' }
    });

    if (!category) {
      console.log('📂 Creating category Imóveis...');
      category = await prisma.lotCategory.create({
        data: {
          name: 'Imóveis',
          slug: 'imoveis',
          imageUrl: 'https://placehold.co/600x400',
        },
      });
    }
    console.log(`✅ Using category: ${category.id}`);

    // 2.1 Get or Create Seller
    let seller = await prisma.seller.findFirst({
      where: { slug: 'test-seller' }
    });

    if (!seller) {
      console.log('👤 Creating test seller...');
      seller = await prisma.seller.create({
        data: {
          name: 'Test Seller',
          slug: 'test-seller',
          publicId: `seller-${Date.now()}`,
          tenantId: tenant.id,
        },
      });
    }
    console.log(`✅ Using seller: ${seller.id}`);

    // 3. Create Auction
    console.log('🔨 Creating Map Search Test Auction...');
    const auction = await prisma.auction.create({
      data: {
        title: `Leilão de Mapa ${Date.now()}`,
        description: 'Leilão para testes de busca no mapa',
        status: 'ABERTO_PARA_LANCES',
        auctionType: 'EXTRAJUDICIAL',
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
        tenantId: tenant.id,
      },
    });

    // 4. Create Lots with Coordinates
    console.log('📍 Creating Lots with coordinates...');
    
    // Lot 1: São Paulo
    await prisma.lot.create({
      data: {
        title: 'Apartamento em São Paulo',
        description: 'Excelente localização no centro.',
        price: 500000,
        initialPrice: 500000,
        bidIncrementStep: 5000,
        status: 'ABERTO_PARA_LANCES',
        auctionId: auction.id,
        categoryId: category.id,
        tenantId: tenant.id,
        sellerId: seller.id,
        imageUrl: 'https://placehold.co/600x400',
        cityName: 'São Paulo',
        stateUf: 'SP',
        mapAddress: 'Av. Paulista, 1000',
        latitude: -23.5505,
        longitude: -46.6333,
        number: '101',
        type: 'Imóvel',
      },
    });

    // Lot 2: Rio de Janeiro
    await prisma.lot.create({
      data: {
        title: 'Casa no Rio de Janeiro',
        description: 'Vista para o mar.',
        price: 1200000,
        initialPrice: 1200000,
        bidIncrementStep: 10000,
        status: 'ABERTO_PARA_LANCES',
        auctionId: auction.id,
        categoryId: category.id,
        tenantId: tenant.id,
        sellerId: seller.id,
        imageUrl: 'https://placehold.co/600x400',
        cityName: 'Rio de Janeiro',
        stateUf: 'RJ',
        mapAddress: 'Av. Atlântica, 500',
        latitude: -22.9068,
        longitude: -43.1729,
        number: '102',
        type: 'Imóvel',
      },
    });

    // Lot 3: Brasília
    await prisma.lot.create({
      data: {
        title: 'Terreno em Brasília',
        description: 'Área nobre.',
        price: 300000,
        initialPrice: 300000,
        bidIncrementStep: 2000,
        status: 'ABERTO_PARA_LANCES',
        auctionId: auction.id,
        categoryId: category.id,
        tenantId: tenant.id,
        sellerId: seller.id,
        imageUrl: 'https://placehold.co/600x400',
        cityName: 'Brasília',
        stateUf: 'DF',
        mapAddress: 'Sqn 100',
        latitude: -15.7801,
        longitude: -47.9292,
        number: '103',
        type: 'Imóvel',
      },
    });

    // 5. Create Direct Sale
    console.log('🏷️ Creating Direct Sale...');
    await prisma.directSaleOffer.create({
      data: {
        title: 'Sala Comercial em Curitiba',
        description: 'Centro Cívico.',
        publicId: `ds-${Date.now()}`,
        price: 250000,
        status: 'ACTIVE',
        offerType: 'BUY_NOW',
        categoryId: category.id,
        tenantId: tenant.id,
        imageUrl: 'https://placehold.co/600x400',
        locationCity: 'Curitiba',
        locationState: 'PR',
        sellerId: seller.id,
      },
    });

    console.log('✅ Map search test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding map search data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMapSearchData();
