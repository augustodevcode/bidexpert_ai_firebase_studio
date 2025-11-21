/**
 * Complete Auction Scenario Creator
 * Creates: Asset (Motorcycle YAM

AHA), Auction, Lot, Bidder with habilitation, and sample bid
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Creating Complete Auction Scenario ===\n');
  
  // Step 1: Fetch necessary base data
  console.log('1. Fetching base data...');
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error ('Tenant not found');
  const tenantId = tenant.id;
  
  // Find Maringá city
  const cityMaringa = await prisma.city.findFirst({
    where: { name: 'Maringá', ibgeCode: '4115200' }
  });
  if (!cityMaringa) throw new Error('Maringá city not found. Run create-maringa-city.ts first.');
  
  // Find vehicle category
  let categoryVeiculos = await prisma.lotCategory.findFirst({
    where: { name: { contains: 'Veículos' } }
  });
  
  if (!categoryVeiculos) {
    console.log('Creating Veículos category...');
    categoryVeiculos = await prisma.lotCategory.create({
      data: {
        name: 'Veículos',
        slug: 'veiculos',
        description: 'Veículos automotores',
        hasSubcategories: true
      }
    });
  }
  
  // Find/Create Motos subcategory
  let subcategoryMotos = await prisma.subcategory.findFirst({
    where: { name: 'Motos', parentCategoryId: categoryVeiculos.id }
  });
  
  if (!subcategoryMotos) {
    console.log('Creating Motos subcategory...');
    subcategoryMotos = await prisma.subcategory.create({
      data: {
        name: 'Motos',
        slug: 'motos',
        parentCategoryId: categoryVeiculos.id,
        description: 'Motocicletas',
        displayOrder: 1
      }
    });
  }
  
  // Find auctioneer (first one from seed)
  const auctioneer = await prisma.auctioneer.findFirst({
    where: { tenantId }
  });
  if (!auctioneer) throw new Error('No auctioneer found. Run seed first.');
  
  // Find or create Banco Bradesco seller
  let sellerBradesco = await prisma.seller.findFirst({
    where: { name: { contains: 'Bradesco' } }
  });
  
  if (!sellerBradesco) {
    console.log('Creating Banco Bradesco seller...');
    sellerBradesco = await prisma.seller.create({
      data: {
        publicId: `SELLER-BRADESCO-${Date.now()}`,
        name: 'Banco Bradesco',
        slug: 'banco-bradesco',
        isJudicial: false,
        tenantId,
        description: 'Banco Bradesco - Comitente'
      }
    });
  }
  
  console.log(`✓ Base data fetched\n`);
  
  // Step 2: Create Asset (Motorcycle)
  console.log('2. Creating Motorcycle Asset...');
  const assetMoto = await prisma.asset.create({
    data: {
      publicId: `ASSET-MOTO-${Date.now()}`,
     title: 'YAMAHA FACTOR YBR125 ED 2009',
      description: 'Motocicleta YAMAHA FACTOR YBR125 ED ano/modelo 2009, cor preta, FIPE 6302. Veículo em bom estado de conservação. Documentação regular. Aceita financiamento.',
      status: 'DISPONIVEL',
      categoryId: categoryVeiculos.id,
      subcategoryId: subcategoryMotos.id,
      sellerId: sellerBradesco.id,
      tenantId,
      evaluationValue: 5000.00,
      locationCity: 'Maringá',
      locationState: 'PR',
      address: 'Rua Endereço do Bem, 2203',
      // Vehicle specific fields
      plate: 'ABC1D23',
      make: 'YAMAHA',
      model: 'FACTOR YBR125 ED',
      year: 2009,
      modelYear: 2009,
      color: 'Preta',
      fuelType: 'Gasolina',
      vin: `9BFYAM${Date.now()}`,
      renavam: `${String(Date.now()).slice(-11)}`,
      mileage: 45000,
      runningCondition: 'Funciona perfeitamente',
      bodyCondition: 'Bom estado',
      hasKey: true
    }
  });
  console.log(`✓ Asset created: ${assetMoto.title} (ID: ${assetMoto.id})\n`);
  
  // Step 3: Create Auction
  console.log('3. Creating Auction...');
  const auctionDate = new Date('2025-11-25T09:00:00-03:00');
  const openingDate = new Date('2025-10-20T09:00:00-03:00');
  const endDate = new Date('2025-11-26T12:04:00-03:00');
  
  const auction = await prisma.auction.create({
    data: {
      publicId: `AUCTION-VEICULOS-${Date.now()}`,
      slug: `leilao-veiculos-01-2025-${Date.now()}`,
      title: 'LEILÃO DE VEÍCULOS 01/2025 CONSERVADOS',
      description: `Leilão extrajudicial do comitente Banco Bradesco.
      
Praça única - 25/11 - 09:00
Encerramento: 26/11/2025 às 12:04:00
Data de Abertura: 20/10/2025 às 09:00

Leilão online com relist e softclose ativados.

**Perguntas e Respostas:**
Como dar o lance no valor que o vendedor quer?
Todos os eventos da modalidade Leilão iniciam-se com um valor de referência. Para participar é necessário seguir as regras e enviar os lances de acordo com o incremento pré-estabelecido por cada vendedor e o quanto cada participante deseja pagar no bem. No final, o vendedor irá analisar se aceita ou não o valor proposto.`,
      status: 'ABERTO_PARA_LANCES',
      auctionDate,
      endDate,
      auctionType: 'EXTRAJUDICIAL',
      auctionMethod: 'STANDARD',
      participation: 'ONLINE',
      tenantId,
      auctioneerId: auctioneer.id,
      sellerId: sellerBradesco.id,
      cityId: cityMaringa.id,
      stateId: cityMaringa.stateId,
      softCloseEnabled: true,
      softCloseMinutes: 5
    }
  });
  console.log(`✓ Auction created: ${auction.title} (ID: ${auction.id})\n`);
  
  // Step 4: Create Auction Stage
  console.log('4. Creating Auction Stage...');
  const stage = await prisma.auctionStage.create({
    data: {
      name: 'Praça Única',
      startDate: auctionDate,
      endDate,
      auctionId: auction.id,
      initialPrice: 3000.00,
      status: 'AGUARDANDO_INICIO'
    }
  });
  console.log(`✓ Stage created: ${stage.name}\n`);
  
  // Step 5: Create Lot
  console.log('5. Creating Lot...');
  const lot = await prisma.lot.create({
    data: {
      publicId: `LOT-MOTO-${Date.now()}`,
      auctionId: auction.id,
      number: '001',
      title: assetMoto.title,
      description: assetMoto.description,
      price: 3000.00,
      initialPrice: 3000.00,
      bidIncrementStep: 300.00,
      status: 'ABERTO_PARA_LANCES',
      tenantId,
      categoryId: categoryVeiculos.id,
      subcategoryId: subcategoryMotos.id,
      sellerId: sellerBradesco.id,
      auctioneerId: auctioneer.id,
      cityId: cityMaringa.id,
      stateId: cityMaringa.stateId,
      // Location from asset
      cityName: assetMoto.locationCity,
      stateUf: assetMoto.locationState,
      type: 'EXTRAJUDICIAL',
      isFeatured: true
    }
  });
  console.log(`✓ Lot created: ${lot.title} (ID: ${lot.id})\n`);
  
  // Link asset to lot
  await prisma.assetsOnLots.create({
    data: {
      lotId: lot.id,
      assetId: assetMoto.id,
      assignedBy: 'script'
    }
  });
  console.log(`✓ Asset linked to lot\n`);
  
  // Step 6: Find or Create a Bidder
  console.log('6. Setting up Bidder...');
  const bidderRole = await prisma.role.findFirst({
    where: { nameNormalized: 'BIDDER' }
  });
  if (!bidderRole) throw new Error('BIDDER role not found');
  
  let bidder = await prisma.user.findFirst({
    where: {
      roles: {
        some: { roleId: bidderRole.id }
      },
      habilitationStatus: 'HABILITADO'
    }
  });
  
  if (!bidder) {
    console.log('Creating new bidder user...');
    const bcrypt = await import('bcryptjs');
    bidder = await prisma.user.create({
      data: {
        email: 'arrematante.teste@bidexpert.com',
        password: await bcrypt.hash('Teste@123', 10),
        fullName: 'Arrematante Teste',
        habilitationStatus: 'HABILITADO',
        accountType: 'PHYSICAL',
        cpf: '12345678900',
        cellPhone: '+55 44 99999-9999',
        roles: {
          create: { roleId: bidderRole.id, assignedBy: 'script' }
        },
        tenants: {
          create: { tenantId, assignedBy: 'script' }
        }
      }
    });
  }
  console.log(`✓ Bidder ready: ${bidder.email} (ID: ${bidder.id})\n`);
  
  // Step 7: Habilitate bidder for auction
  console.log('7. Habilitating bidder for auction...');
  const existing = await prisma.auctionHabilitation.findUnique({
    where: {
      userId_auctionId: {
        userId: bidder.id,
        auctionId: auction.id
      }
    }
  });
  
  if (!existing) {
    await prisma.auctionHabilitation.create({
      data: {
        userId: bidder.id,
        auctionId: auction.id
      }
    });
    console.log(`✓ Bidder habilitated for auction\n`);
  } else {
    console.log(`✓ Bidder already habilitated\n`);
  }
  
  // Step 8: Create a sample bid
  console.log('8. Creating sample bid...');
  const bid = await prisma.bid.create({
    data: {
      lotId: lot.id,
      auctionId: auction.id,
      bidderId: bidder.id,
      amount: 3300.00,
      tenantId,
      bidderDisplay: bidder.fullName || 'Arrematante'
    }
  });
  console.log(`✓ Bid created: R$ ${bid.amount}\n`);
  
  // Summary
  console.log('=== SCENARIO CREATED SUCCESSFULLY ===\n');
  console.log('📍 DADOS CRIADOS:');
  console.log(`   Cidade: Maringá-PR (${cityMaringa.ibgeCode})`);
  console.log(`   Bem: ${assetMoto.title}`);
  console.log(`   Valor FIPE: R$ 5.000,00`);
  console.log(`   Localização: ${assetMoto.address}, ${assetMoto.locationCity}-${assetMoto.locationState}`);
  console.log(`   
   Leilão: ${auction.title}`);
  console.log(`   Comitente: ${sellerBradesco.name}`);
  console.log(`   Leiloeiro: ${auctioneer.name}`);
  console.log(`   Abertura: ${openingDate.toLocaleString('pt-BR')}`);
  console.log(`   Encerramento: ${endDate.toLocaleString('pt-BR')}`);
  console.log(`   
   Lote #${lot.number}: ${lot.title}`);
  console.log(`   Lance Inicial: R$ ${lot.initialPrice}`);
  console.log(`   Incremento: R$ ${lot.bidIncrementStep}`);
  console.log(`   
   Arrematante: ${bidder.email}`);
  console.log(`   Status: HABILITADO`);
  console.log(`   Primeiro Lance: R$ ${bid.amount}`);
  console.log('\n📌 PRÓXIMOS PASSOS:');
  console.log(`   1. Acesse http://localhost:9005 no navegador`);
  console.log(`   2. Faça login como: ${bidder.email} / Teste@123`);
  console.log(`   3. Navegue até o leilão "${auction.title}"`);
  console.log(`   4. Verifique o lote e o lance registrado`);
  console.log(`   5. Teste filtros e visualização em cards/lista`);
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
