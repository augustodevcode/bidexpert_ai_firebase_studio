// scripts/seed-auction-v2-simple.ts
/**
 * @fileoverview Seed para criar um leilão completo com todos os campos.
 * 
 * Este script cria um leilão com todos os campos preenchidos,
 * usando o Prisma diretamente (mesma lógica do AuctionService.createAuction).
 * 
 * Execução: npx ts-node scripts/seed-auction-v2-simple.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função auxiliar para gerar slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Função auxiliar para gerar publicId
function generatePublicId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'AUC-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedAuctionV2() {
  console.log('🚀 Iniciando seed de leilão V2...\n');

  try {
    // 1. Buscar tenant existente
    const tenant = await prisma.tenant.findFirst({
      orderBy: { id: 'asc' },
    });
    
    if (!tenant) {
      throw new Error('❌ Nenhum tenant encontrado. Execute o seed principal primeiro.');
    }
    console.log(`✅ Tenant encontrado: ${tenant.name} (ID: ${tenant.id})`);

    // 2. Buscar leiloeiro existente ou criar um básico
    let auctioneer = await prisma.auctioneer.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!auctioneer) {
      console.log('📝 Criando leiloeiro...');
      auctioneer = await prisma.auctioneer.create({
        data: {
          name: 'Leiloeiro Exemplo V2',
          email: 'leiloeiro.v2@bidexpert.com',
          publicId: `AUC-${Date.now()}`,
          tenantId: tenant.id,
          slug: 'leiloeiro-exemplo-v2',
        },
      });
    }
    console.log(`✅ Leiloeiro: ${auctioneer.name} (ID: ${auctioneer.id})`);

    // 3. Buscar comitente existente ou criar um básico
    let seller = await prisma.seller.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!seller) {
      console.log('📝 Criando comitente...');
      seller = await prisma.seller.create({
        data: {
          name: 'Comitente Exemplo V2',
          email: 'comitente.v2@bidexpert.com',
          publicId: `SEL-${Date.now()}`,
          tenantId: tenant.id,
          slug: 'comitente-exemplo-v2',
        },
      });
    }
    console.log(`✅ Comitente: ${seller.name} (ID: ${seller.id})`);

    // 4. Buscar categoria existente ou criar uma básica
    let category = await prisma.lotCategory.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!category) {
      console.log('📝 Criando categoria...');
      category = await prisma.lotCategory.create({
        data: {
          name: 'Imóveis',
          tenantId: tenant.id,
          slug: 'imoveis',
        },
      });
    }
    console.log(`✅ Categoria: ${category.name} (ID: ${category.id})`);

    // 5. Buscar estado e cidade existentes
    let state = await prisma.state.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!state) {
      console.log('📝 Criando estado...');
      state = await prisma.state.create({
        data: {
          name: 'São Paulo',
          uf: 'SP',
          slug: 'sao-paulo',
        },
      });
    }
    console.log(`✅ Estado: ${state.name} (ID: ${state.id})`);

    let city = await prisma.city.findFirst({
      where: { stateId: state.id },
    });

    if (!city) {
      console.log('📝 Criando cidade...');
      city = await prisma.city.create({
        data: {
          name: 'São Paulo',
          stateId: state.id,
        },
      });
    }
    console.log(`✅ Cidade: ${city.name} (ID: ${city.id})`);

    // 6. Preparar dados do leilão
    const now = new Date();
    const startDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 dias
    const endDate1 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 dias
    const startDate2 = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // +21 dias
    const endDate2 = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // +28 dias

    const title = `Leilão Judicial V2 - ${now.toISOString().split('T')[0]}`;
    const publicId = generatePublicId();
    const slug = slugify(title);

    console.log('\n📋 Dados do leilão a ser criado:');
    console.log('   Título:', title);
    console.log('   Public ID:', publicId);
    console.log('   Slug:', slug);
    console.log('   Status: EM_BREVE');
    console.log('   Tipo: JUDICIAL');
    console.log('   Método: STANDARD');
    console.log('   Participação: ONLINE');
    console.log('   Soft Close: 5 min');
    console.log('   Praças: 2');

    // 7. Criar leilão em transação (mesma lógica do AuctionService)
    console.log('\n🔄 Criando leilão via Prisma.$transaction()...');

    const createdAuction = await prisma.$transaction(async (tx) => {
      // Criar o leilão
      const auction = await tx.auction.create({
        data: {
          // Identificação
          publicId,
          slug,
          title,
          description: `Este é um leilão de demonstração criado pelo seed V2.
      
Inclui imóveis residenciais e comerciais localizados na região metropolitana de São Paulo.

**Condições de Participação:**
- Habilitação prévia obrigatória
- Garantia de 5% do valor do lance
- Pagamento à vista ou parcelado em até 30x

**Documentação:**
- Edital completo disponível no site
- Laudo de avaliação anexo
- Matrícula atualizada`,

          // Status e tipo
          status: 'EM_BREVE',
          auctionType: 'JUDICIAL',
          auctionMethod: 'STANDARD',
          participation: 'ONLINE',

          // Data do leilão (primeira praça)
          auctionDate: startDate1,

          // Relacionamentos
          tenantId: tenant.id,
          auctioneerId: auctioneer.id,
          sellerId: seller.id,
          categoryId: category.id,
          stateId: state.id,
          cityId: city.id,

          // Localização
          zipCode: '01310-100',
          
          // URLs
          onlineUrl: 'https://bidexpert.com.br/leilao-v2-exemplo',

          // Configurações
          isFeaturedOnMarketplace: true,
          softCloseEnabled: true,
          softCloseMinutes: 5,
        },
      });

      // Criar as praças (stages)
      await tx.auctionStage.createMany({
        data: [
          {
            name: '1ª Praça',
            startDate: startDate1,
            endDate: endDate1,
            initialPrice: 500000,
            auctionId: auction.id,
            tenantId: tenant.id,
          },
          {
            name: '2ª Praça',
            startDate: startDate2,
            endDate: endDate2,
            initialPrice: 350000,
            auctionId: auction.id,
            tenantId: tenant.id,
          },
        ],
      });

      return auction;
    });

    console.log('\n✅ SUCESSO!');
    console.log(`   ID do Leilão: ${createdAuction.id}`);

    // 8. Buscar leilão completo para exibição
    const fullAuction = await prisma.auction.findUnique({
      where: { id: createdAuction.id },
      include: {
        auctioneer: { select: { name: true } },
        seller: { select: { name: true } },
        category: { select: { name: true } },
        stateRef: { select: { name: true } },
        cityRef: { select: { name: true } },
        stages: true,
      },
    });

    if (fullAuction) {
      console.log('\n📊 Leilão criado com sucesso:');
      console.log('   ─────────────────────────────────────');
      console.log(`   ID:          ${fullAuction.id}`);
      console.log(`   Public ID:   ${fullAuction.publicId}`);
      console.log(`   Slug:        ${fullAuction.slug}`);
      console.log(`   Título:      ${fullAuction.title}`);
      console.log(`   Status:      ${fullAuction.status}`);
      console.log(`   Tipo:        ${fullAuction.auctionType}`);
      console.log(`   Método:      ${fullAuction.auctionMethod}`);
      console.log(`   Participação: ${fullAuction.participation}`);
      console.log(`   Leiloeiro:   ${fullAuction.auctioneer?.name}`);
      console.log(`   Comitente:   ${fullAuction.seller?.name}`);
      console.log(`   Categoria:   ${fullAuction.category?.name}`);
      console.log(`   Estado:      ${fullAuction.stateRef?.name}`);
      console.log(`   Cidade:      ${fullAuction.cityRef?.name}`);
      console.log(`   CEP:         ${fullAuction.zipCode}`);
      console.log(`   URL Online:  ${fullAuction.onlineUrl}`);
      console.log(`   Destaque:    ${fullAuction.isFeaturedOnMarketplace ? 'Sim' : 'Não'}`);
      console.log(`   Soft Close:  ${fullAuction.softCloseEnabled ? `${fullAuction.softCloseMinutes} min` : 'Desativado'}`);
      console.log(`   Data Leilão: ${fullAuction.auctionDate?.toISOString()}`);
      console.log('   ─────────────────────────────────────');
      
      console.log('\n📅 Praças criadas:');
      fullAuction.stages.forEach((stage, index) => {
        console.log(`   ${index + 1}. ${stage.name}`);
        console.log(`      Início: ${stage.startDate.toISOString()}`);
        console.log(`      Fim:    ${stage.endDate?.toISOString() ?? 'Não definido'}`);
        console.log(`      Valor:  R$ ${stage.initialPrice?.toString() ?? 'Não definido'}`);
      });

      console.log('\n🌐 Acesse o leilão em:');
      console.log(`   http://localhost:9002/admin/auctions-v2/${fullAuction.id}`);
    }

  } catch (error) {
    console.error('\n❌ Erro durante a execução do seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão com banco de dados encerrada.');
  }
}

// Executa o seed
seedAuctionV2()
  .then(() => {
    console.log('\n✨ Seed concluído!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed falhou:', error);
    process.exit(1);
  });
