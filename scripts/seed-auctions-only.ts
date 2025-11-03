import { PrismaClient, Prisma, AuctionStatus, LotStatus, AssetStatus, AuctionType, AuctionMethod, AuctionParticipation } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Configuração do Faker
faker.seed(123);

async function seedAuctionsAndLots() {
  console.log('🚀 Iniciando seed de Leilões e Lotes...');
  
  try {
    // Verifica se existem ativos disponíveis
    const assets = await prisma.asset.findMany({
      where: {
        status: "DISPONIVEL"
      },
      take: 50
    });

    if (assets.length === 0) {
      throw new Error('Nenhum ativo disponível encontrado. É necessário ter ativos antes de criar leilões.');
    }

    console.log(`✅ Encontrados ${assets.length} ativos disponíveis`);

    // Cria 5 leilões
    for (let i = 0; i < 5; i++) {
      const startDate = faker.date.soon({ days: 7 });
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7); // 1 semana de duração

      // Escolhe aleatoriamente alguns ativos para este leilão (entre 3 e 10)
      const assetsForAuction = faker.helpers.arrayElements(
        assets,
        faker.number.int({ min: 3, max: Math.min(10, assets.length) })
      );

      console.log(`\n🏷️  Criando leilão ${i + 1} com ${assetsForAuction.length} lotes...`);

      // Primeiro, verifica se existe um tenant
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        throw new Error('Nenhum tenant encontrado. É necessário ter pelo menos um tenant para criar leilões.');
      }

      // Cria o leilão
      const auction = await prisma.auction.create({
        data: {
          publicId: `AUCTION-${uuidv4()}`,
          title: `Leilão ${faker.commerce.department()} ${faker.number.int({ min: 1, max: 100 })}`,
          description: faker.lorem.paragraphs(2),
          auctionDate: startDate,
          endDate: endDate,
          status: AuctionStatus.EM_BREVE,
          auctionType: faker.helpers.arrayElement(Object.values(AuctionType)),
          auctionMethod: faker.helpers.arrayElement(Object.values(AuctionMethod)),
          participation: faker.helpers.arrayElement(Object.values(AuctionParticipation)),
          address: `${faker.location.streetAddress()}, ${faker.location.city()} - ${faker.location.state()}`,
          zipCode: faker.location.zipCode('#####-###'),
          isFeaturedOnMarketplace: faker.datatype.boolean(),
          tenant: { connect: { id: tenant.id } },
          totalLots: assetsForAuction.length,
          // Outros campos obrigatórios com valores padrão
          visits: 0,
          totalHabilitatedUsers: 0,
          isRelisted: false,
          relistCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Leilão criado: ${auction.title} (ID: ${auction.id})`);

      // Cria os lotes para o leilão
      for (const [index, asset] of assetsForAuction.entries()) {
        const price = faker.number.float({ min: 1000, max: 50000 });
        
const lot = await prisma.lot.create({
          data: {
            publicId: `LOT-${uuidv4()}`,
            auction: { connect: { id: auction.id } },
            number: (index + 1).toString(),
            title: `Lote ${index + 1}: ${asset.title}`,
            description: asset.description?.substring(0, 200) || `Descrição do lote ${index + 1}`,
            price: new Decimal(price),
            initialPrice: new Decimal(price * 0.8), // 80% do preço final
            status: LotStatus.EM_BREVE,
            type: 'DEFAULT',
            condition: faker.helpers.arrayElement(['NOVO', 'USADO', 'REMANUFATURADO', 'SEMINOVO']),
            tenant: { connect: { id: tenant.id } },
            bidsCount: 0,
            views: 0,
            isFeatured: faker.datatype.boolean(),
            isExclusive: faker.datatype.boolean(),
            isRelisted: false,
            relistCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Cria o lote primeiro
            // Depois, associa os ativos ao lote usando a tabela de relacionamento
            // A associação será feita após a criação do lote
            // Conecta a categoria se existir
            ...(asset.categoryId && {
              category: { connect: { id: asset.categoryId } }
            })
          },
        });
        
        console.log(`   - Lote ${index + 1} criado`);
        
        // Agora associa o ativo ao lote usando a tabela de relacionamento
        await prisma.assetsOnLots.create({
          data: {
            lotId: lot.id,
            assetId: asset.id,
            assignedBy: 'sistema',
            assignedAt: new Date()
          }
        });
        
        console.log(`   - Ativo associado ao lote ${index + 1}`);
      }
    }

    console.log('\n✨ Seed de Leilões e Lotes concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed de Leilões e Lotes:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando seed específico para Leilões e Lotes...');
  
  try {
    await seedAuctionsAndLots();
    console.log('\n✅ Seed concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Ocorreu um erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
