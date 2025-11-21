/**
 * Script Final: Completa todo o cenário de teste conforme especificado
 * - Usa moto YAMAHA já criada (ID 604)
 * - Cria leilão com todas as especificações
 * - Cria lote vinculando a moto
 * - Habilita arrematante
 * - Cria lance de teste
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 INICIANDO CADASTRO COMPLETO DO CENÁRIO DE TESTE\n');
  
  // 1. Buscar dados base
  console.log('1️⃣  Buscando dados base...');
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('Nenhum tenant encontrado');
  
  const maringa = await prisma.city.findFirst({
    where: { name: 'Maringá', ibgeCode: '4115200' },
    include: { state: true }
  });
  if (!maringa) throw new Error('Cidade Maringá não encontrada');
  
  const moto = await prisma.asset.findFirst({
    where: { id: 604n } // ID da moto já criada
  });
  if (!moto) throw new Error('Moto YAMAHA não encontrada (ID 604)');
  
  const auctioneer = await prisma.auctioneer.findFirst({
    where: { tenantId: tenant.id }
  });
  if (!auctioneer) throw new Error('Nenhum leiloeiro encontrado');
  
  console.log(`   ✓ Tenant: ${tenant.name}`);
  console.log(`   ✓ Cidade: ${maringa.name}-${maringa.state.uf}`);
  console.log(`   ✓ Moto: ${moto.title}`);
  console.log(`   ✓ Leiloeiro: ${auctioneer.name}\n`);
  
  // 2. Criar/Verificar Banco Bradesco como vendedor
  console.log('2️⃣  Verificando vendedor Banco Bradesco...');
  let bradesco = await prisma.seller.findFirst({
    where: { name: { contains: 'Bradesco' } }
  });
  
  if (!bradesco) {
    console.log('   Criando Banco Bradesco...');
    bradesco = await prisma.seller.create({
      data: {
        publicId: `SELLER-BRADESCO-${Date.now()}`,
        name: 'Banco Bradesco',
        slug: `banco-bradesco-${Date.now()}`,
        isJudicial: false,
        tenantId: tenant.id,
        description: 'Banco Bradesco S.A. - Comitente',
        city: 'São Paulo',
        state: 'SP'
      }
    });
  }
  console.log(`   ✓ Bradesco: ${bradesco.name} (ID: ${bradesco.id})\n`);
  
  // 3. Criar Leilão
  console.log('3️⃣  Criando leilão...');
  const auctionDate = new Date('2025-11-25T09:00:00-03:00');
  const openingDate = new Date('2025-10-20T09:00:00-03:00');
  const endDate = new Date('2025-11-26T12:04:00-03:00');
  
  const auction = await prisma.auction.create({
    data: {
      publicId: `AUCTION-VEICULOS-${Date.now()}`,
      slug: `leilao-veiculos-01-2025-${Date.now()}`,
      title: 'LEILÃO DE VEÍCULOS 01/2025 CONSERVADOS',
      description: `Leilão extrajudicial do comitente Banco Bradesco.

📅 Praça única - 25/11 - 09:00
🏁 Encerramento: 26/11/2025 às 12:04:00
🔓 Data de Abertura: 20/10/2025 às 09:00

🌐 Leilão online com relist e softclose ativados.

❓ **Perguntas e Respostas:**

**Como dar o lance no valor que o vendedor quer?**
Todos os eventos da modalidade Leilão iniciam-se com um valor de referência. Para participar é necessário seguir as regras e enviar os lances de acordo com o incremento pré-estabelecido por cada vendedor e o quanto cada participante deseja pagar no bem. No final, o vendedor irá analisar se aceita ou não o valor proposto.`,
      status: 'ABERTO_PARA_LANCES',
      auctionDate,
      endDate,
      auctionType: 'EXTRAJUDICIAL',
      auctionMethod: 'STANDARD',
      participation: 'ONLINE',
      tenantId: tenant.id,
      auctioneerId: auctioneer.id,
      sellerId: bradesco.id,
      cityId: maringa.id,
      stateId: maringa.stateId,
      softCloseEnabled: true,
      softCloseMinutes: 5,
      isRelisted: false,
      relistCount: 0
    }
  });
  console.log(`   ✓ Leilão criado: ${auction.title}`);
  console.log(`   ✓ ID: ${auction.id}\n`);
  
  // 4. Criar Stage do Leilão
  console.log('4️⃣  Criando praça do leilão...');
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
  console.log(`   ✓ Praça criada: ${stage.name}\n`);
  
  // 5. Criar Lote vinculando a moto
  console.log('5️⃣  Criando lote...');
  const lot = await prisma.lot.create({
    data: {
      publicId: `LOT-MOTO-${Date.now()}`,
      auctionId: auction.id,
      number: '001',
      title: 'YAMAHA FACTOR YBR125 ED 2009 - PRETA',
      description: `Motocicleta YAMAHA FACTOR YBR125 ED 2009, cor preta.
      
🔖 FIPE: 6302
💰 Valor de Mercado: R$ 5.000,00
📍 Localização: Rua Endereço do Bem, 2203, CEP 87043-420, Maringá-PR

🏍️ **Especificações:**
- Marca: YAMAHA
- Modelo: FACTOR YBR125 ED
- Ano/Modelo: 2009/2009
- Cor: Preta
- Documentação regular

📋 Lance inicial: R$ 3.000,00
📈 Incremento: R$ 300,00`,
      price: 3000.00,
      initialPrice: 3000.00,
      bidIncrementStep: 300.00,
      status: 'ABERTO_PARA_LANCES',
      tenantId: tenant.id,
      categoryId: moto.categoryId,
      subcategoryId: moto.subcategoryId,
      sellerId: bradesco.id,
      auctioneerId: auctioneer.id,
      cityId: maringa.id,
      stateId: maringa.stateId,
      cityName: 'Maringá',
      stateUf: 'PR',
      mapAddress: 'Rua Endereço do Bem, 2203, Maringá - PR, 87043-420',
      latitude: -23.4205,  // Coordenadas aproximadas de Maringá
      longitude: -51.9333,
      type: 'EXTRAJUDICIAL',
      isFeatured: true
    }
  });
  console.log(`   ✓ Lote criado: ${lot.title}`);
  console.log(`   ✓ ID: ${lot.id}\n`);
  
  // 6. Vincular a moto ao lote
  console.log('6️⃣  Vinculando moto ao lote...');
  await prisma.assetsOnLots.create({
    data: {
      lotId: lot.id,
      assetId: moto.id,
      assignedBy: 'system'
    }
  });
  console.log(`   ✓ Moto vinculada ao lote\n`);
  
  // 7. Buscar ou criar arrematante
  console.log('7️⃣  Configurando arrematante...');
  const bidderRole = await prisma.role.findFirst({
    where: { name: { contains: 'COMPRADOR' } }
  });
  if (!bidderRole) throw new Error('Role COMPRADOR não encontrada');
  
  let bidder = await prisma.user.findFirst({
    where: { email: 'test.comprador@bidexpert.com' }
  });
  
  if (!bidder) {
    console.log('   Criando usuário arrematante...');
    bidder = await prisma.user.create({
      data: {
        email: 'test.comprador@bidexpert.com',
        password: await bcrypt.hash('Test@12345', 10),
        fullName: 'Arrematante Teste',
        habilitationStatus: 'HABILITADO',
        accountType: 'PHYSICAL',
        cpf: '98765432100',
        cellPhone: '+55 44 98888-8888',
        roles: {
          create: { roleId: bidderRole.id, assignedBy: 'system' }
        },
        tenants: {
          create: { tenantId: tenant.id, assignedBy: 'system' }
        }
      }
    });
  } else {
    console.log(`   ✓ Arrematante já existe: ${bidder.email}`);
  }
  
  // 8. Habilitar arrematante para o leilão
  console.log('8️⃣  Habilitando arrematante no leilão...');
  const existingHab = await prisma.auctionHabilitation.findUnique({
    where: {
      userId_auctionId: {
        userId: bidder.id,
        auctionId: auction.id
      }
    }
  });
  
  if (!existingHab) {
    await prisma.auctionHabilitation.create({
      data: {
        userId: bidder.id,
        auctionId: auction.id
      }
    });
    console.log(`   ✓ Arrematante habilitado para o leilão\n`);
  } else {
    console.log(`   ✓ Arrematante já estava habilitado\n`);
  }
  
  // 9. Criar lance de teste
  console.log('9️⃣  Criando lance de teste...');
  const bid = await prisma.bid.create({
    data: {
      lotId: lot.id,
      auctionId: auction.id,
      bidderId: bidder.id,
      amount: 3300.00,
      tenantId: tenant.id,
      bidderDisplay: bidder.fullName || 'Arrematante'
    }
  });
  console.log(`   ✓ Lance criado: R$ ${bid.amount}\n`);
  
  // 10. Sumário Final
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ CENÁRIO COMPLETO CRIADO COM SUCESSO!\n');
  console.log('📋 RESUMO:');
  console.log(`   🏙️  Cidade: ${maringa.name}-${maringa.state.uf}`);
  console.log(`   🏍️  Bem: ${moto.title} (ID: ${moto.id})`);
  console.log(`   🔨 Leilão: ${auction.title}`);
  console.log(`      - ID: ${auction.id}`);
  console.log(`      - Comitente: ${bradesco.name}`);
  console.log(`      - Leiloeiro: ${auctioneer.name}`);
  console.log(`      - Abertura: 20/10/2025 09:00`);
  console.log(`      - Praça: 25/11/2025 09:00`);
  console.log(`      - Encerramento: 26/11/2025 12:04`);
  console.log(`   📦 Lote: #${lot.number} - ${lot.title}`);
  console.log(`      - ID: ${lot.id}`);
  console.log(`      - Lance Inicial: R$ ${lot.initialPrice}`);
  console.log(`      - Incremento: R$ ${lot.bidIncrementStep}`);
  console.log(`      - Localização: ${lot.mapAddress}`);
  console.log(`   👤 Arrematante: ${bidder.email}`);
  console.log(`      - Status: HABILITADO`);
  console.log(`      - Lance: R$ ${bid.amount}`);
  console.log('\n🌐 TESTES NA UI:');
  console.log(`   1. Acesse: http://localhost:9005`);
  console.log(`   2. Login Leiloeiro: test.leiloeiro@bidexpert.com / Test@12345`);
  console.log(`   3. Login Arrematante: test.comprador@bidexpert.com / Test@12345`);
  console.log(`   4. Navegue até o leilão "${auction.title}"`);
  console.log(`   5. Verifique o lote ${lot.number} com todas as informações`);
  console.log(`   6. Teste filtros, visualização card/lista, mapa`);
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch(e => {
    console.error('\n❌ ERRO:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
