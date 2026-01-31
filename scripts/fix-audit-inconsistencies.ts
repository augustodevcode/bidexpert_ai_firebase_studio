/**
 * @fileoverview Script de correção de inconsistências de dados identificadas na auditoria.
 * NÃO MODIFICA o seed principal - apenas corrige dados existentes.
 * 
 * Corrige:
 * - Lotes sem Ativos (15)
 * - Leilões Judiciais sem Processo (4)
 * - Leilões sem Responsáveis (3)
 * - Itens sem Imagem (1)
 * - Usuários Habilitados sem Documentos (1)
 * - Tabelas com poucos dados
 * - Tabela documentTemplate vazia
 */
import { PrismaClient, LotStatus, AssetStatus, UserDocumentStatus } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import bcrypt from 'bcryptjs';

faker.seed(20260131);

const prisma = new PrismaClient();
const TENANT_ID = BigInt(1);

async function main() {
  console.log('🔧 Iniciando correção de inconsistências...\n');
  
  // 1. Corrigir Lotes sem Ativos
  await fixLotsWithoutAssets();
  
  // 2. Corrigir Leilões Judiciais sem Processo
  await fixJudicialAuctionsWithoutProcess();
  
  // 3. Corrigir Leilões sem Responsáveis
  await fixAuctionsWithoutResponsible();
  
  // 4. Corrigir Ativos sem Imagem
  await fixAssetsWithoutImage();
  
  // 5. Corrigir Usuários Habilitados sem Documentos
  await fixHabilitationsWithoutDocs();
  
  // 6. Criar DocumentTemplates (tabela vazia)
  await createDocumentTemplates();
  
  // 7. Incrementar tabelas com poucos dados
  await incrementLowDataTables();
  
  console.log('\n✅ Correções concluídas!');
  await prisma.$disconnect();
}

/**
 * Corrige Lotes sem Ativos criando um asset para cada
 */
async function fixLotsWithoutAssets() {
  console.log('📦 Corrigindo Lotes sem Ativos...');
  
  const lotsWithoutAssets = await prisma.lot.findMany({
    where: { assets: { none: {} } },
    include: { category: true, subcategory: true }
  });
  
  console.log(`   Encontrados: ${lotsWithoutAssets.length} lotes sem ativos`);
  
  for (const lot of lotsWithoutAssets) {
    const assetType = getAssetTypeFromCategory(lot.category?.name || 'Outros');
    const publicId = `ASSET-${Date.now()}-${faker.string.alphanumeric(6).toUpperCase()}`;
    const uniqueVin = `VIN${Date.now()}${faker.string.alphanumeric(4).toUpperCase()}`;
    
    const asset = await prisma.asset.create({
      data: {
        publicId,
        tenantId: TENANT_ID,
        title: lot.title || `Ativo do Lote ${lot.number}`,
        description: lot.description || faker.commerce.productDescription(),
        status: AssetStatus.DISPONIVEL,
        make: faker.company.name(),
        model: faker.vehicle.model(),
        vin: uniqueVin,
        year: faker.date.past({ years: 10 }).getFullYear(),
        evaluationValue: lot.price ? Number(lot.price) : faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 }),
        dataAiHint: `asset lote ${lot.number}`,
        categoryId: lot.categoryId,
        subcategoryId: lot.subcategoryId,
      }
    });
    
    // Vincular asset ao lote
    await prisma.assetsOnLots.create({
      data: {
        assetId: asset.id,
        lotId: lot.id,
        assignedBy: 'system-fix-audit',
        tenantId: TENANT_ID,
      }
    });
    
    // Criar imagem para o asset
    const mediaItem = await prisma.mediaItem.create({
      data: {
        tenantId: TENANT_ID,
        fileName: `asset-${asset.id}.jpg`,
        storagePath: `/media/assets/${asset.id}/`,
        urlOriginal: faker.image.url({ width: 800, height: 600 }),
        urlThumbnail: faker.image.url({ width: 200, height: 150 }),
        mimeType: 'image/jpeg',
        sizeBytes: faker.number.int({ min: 100000, max: 500000 }),
        title: `Imagem principal - ${asset.title}`,
        dataAiHint: `imagem ${asset.title}`,
      }
    });
    
    await prisma.assetMedia.create({
      data: {
        tenantId: TENANT_ID,
        assetId: asset.id,
        mediaItemId: mediaItem.id,
        isPrimary: true,
        displayOrder: 0,
      }
    });
    
    console.log(`   ✅ Asset criado para Lote ${lot.id}`);
  }
}

/**
 * Corrige Leilões Judiciais sem Processo
 */
async function fixJudicialAuctionsWithoutProcess() {
  console.log('⚖️ Corrigindo Leilões Judiciais sem Processo...');
  
  const judicialAuctions = await prisma.auction.findMany({
    where: { 
      auctionType: 'JUDICIAL',
      judicialProcessId: null 
    }
  });
  
  console.log(`   Encontrados: ${judicialAuctions.length} leilões judiciais sem processo`);
  
  // Buscar processos existentes ou criar novos
  const existingProcesses = await prisma.judicialProcess.findMany({ take: 10 });
  
  for (let i = 0; i < judicialAuctions.length; i++) {
    const auction = judicialAuctions[i];
    let processId: bigint;
    
    if (existingProcesses[i]) {
      processId = existingProcesses[i].id;
    } else {
      // Criar novo processo
      const court = await prisma.court.findFirst();
      const district = await prisma.judicialDistrict.findFirst();
      const branch = await prisma.judicialBranch.findFirst();
      
      const process = await prisma.judicialProcess.create({
        data: {
          tenantId: TENANT_ID,
          processNumber: `${faker.string.numeric(7)}-${faker.string.numeric(2)}.${2024}.8.26.${faker.string.numeric(4)}`,
          courtId: court?.id || BigInt(1),
          districtId: district?.id,
          branchId: branch?.id,
          processType: faker.helpers.arrayElement(['EXECUCAO_FISCAL', 'RECUPERACAO_JUDICIAL', 'FALENCIA', 'EXECUCAO_CIVIL']),
          processStatus: 'ATIVO',
          filingDate: faker.date.past({ years: 2 }),
          description: faker.lorem.paragraph(),
          dataAiHint: `processo judicial ${auction.title}`,
        }
      });
      processId = process.id;
      console.log(`   ✅ Processo ${process.processNumber} criado`);
    }
    
    await prisma.auction.update({
      where: { id: auction.id },
      data: { judicialProcessId: processId }
    });
    console.log(`   ✅ Leilão ${auction.id} vinculado ao processo ${processId}`);
  }
}

/**
 * Corrige Leilões sem Responsáveis
 */
async function fixAuctionsWithoutResponsible() {
  console.log('👤 Corrigindo Leilões sem Responsáveis...');
  
  const auctionsWithoutResponsible = await prisma.auction.findMany({
    where: { auctioneerId: null }
  });
  
  console.log(`   Encontrados: ${auctionsWithoutResponsible.length} leilões sem responsável`);
  
  // Buscar leiloeiros existentes
  let auctioneers = await prisma.auctioneer.findMany({ where: { tenantId: TENANT_ID } });
  
  // Se não tiver leiloeiros suficientes, criar mais sem userId (leiloeiros externos)
  if (auctioneers.length < 4) {
    for (let i = auctioneers.length; i < 4; i++) {
      const publicId = `AUC-${Date.now()}-${faker.string.alphanumeric(4).toUpperCase()}`;
      const name = faker.person.fullName();
      const slug = faker.helpers.slugify(`${name}-${Date.now()}`).toLowerCase();
      const newAuctioneer = await prisma.auctioneer.create({
        data: {
          publicId,
          slug,
          tenantId: TENANT_ID,
          name,
          description: faker.lorem.paragraph(),
          registrationNumber: `JUCESP-${faker.string.numeric(6)}`,
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          state: 'SP',
          zipCode: faker.location.zipCode(),
        }
      });
      auctioneers.push(newAuctioneer);
      console.log(`   ✅ Leiloeiro ${newAuctioneer.id} criado`);
    }
  }
  
  for (let i = 0; i < auctionsWithoutResponsible.length; i++) {
    const auction = auctionsWithoutResponsible[i];
    const auctioneer = auctioneers[i % auctioneers.length];
    
    await prisma.auction.update({
      where: { id: auction.id },
      data: { auctioneerId: auctioneer.id }
    });
    console.log(`   ✅ Leilão ${auction.id} atribuído ao leiloeiro ${auctioneer.id}`);
  }
}

/**
 * Corrige Ativos sem Imagem
 */
async function fixAssetsWithoutImage() {
  console.log('🖼️ Corrigindo Ativos sem Imagem...');
  
  const assetsWithoutImage = await prisma.asset.findMany({
    where: { gallery: { none: {} } }
  });
  
  console.log(`   Encontrados: ${assetsWithoutImage.length} ativos sem imagem`);
  
  for (const asset of assetsWithoutImage) {
    const mediaItem = await prisma.mediaItem.create({
      data: {
        tenantId: TENANT_ID,
        fileName: `asset-${asset.id}.jpg`,
        storagePath: `/media/assets/${asset.id}/`,
        urlOriginal: faker.image.url({ width: 800, height: 600 }),
        urlThumbnail: faker.image.url({ width: 200, height: 150 }),
        mimeType: 'image/jpeg',
        sizeBytes: faker.number.int({ min: 100000, max: 500000 }),
        title: `Imagem principal - ${asset.title}`,
        dataAiHint: `imagem ${asset.title}`,
      }
    });
    
    await prisma.assetMedia.create({
      data: {
        tenantId: TENANT_ID,
        assetId: asset.id,
        mediaItemId: mediaItem.id,
        isPrimary: true,
        displayOrder: 0,
      }
    });
    console.log(`   ✅ Imagem criada para Asset ${asset.id}`);
  }
}

/**
 * Corrige Habilitações Aprovadas sem Documentos
 */
async function fixHabilitationsWithoutDocs() {
  console.log('📄 Corrigindo Habilitações sem Documentos...');
  
  // Buscar usuários com habilitações mas sem documentos
  const usersWithHabilitationNoDocs = await prisma.user.findMany({
    where: {
      habilitations: { some: {} },
      documents: { none: {} }
    },
    take: 10
  });
  
  console.log(`   Encontrados: ${usersWithHabilitationNoDocs.length} usuários habilitados sem docs`);
  
  // Buscar tipos de documento
  const docTypes = await prisma.documentType.findMany();
  const rgType = docTypes.find(d => d.name.includes('RG')) || docTypes[0];
  const cpfType = docTypes.find(d => d.name.includes('CPF')) || docTypes[1];
  
  for (const user of usersWithHabilitationNoDocs) {
    // Criar documentos para o usuário
    if (rgType) {
      await prisma.userDocument.create({
        data: {
          tenantId: TENANT_ID,
          userId: user.id,
          documentTypeId: rgType.id,
          fileName: `rg-${user.id}.pdf`,
          fileUrl: faker.image.url(),
          status: UserDocumentStatus.APPROVED,
        }
      });
    }
    if (cpfType) {
      await prisma.userDocument.create({
        data: {
          tenantId: TENANT_ID,
          userId: user.id,
          documentTypeId: cpfType.id,
          fileName: `cpf-${user.id}.pdf`,
          fileUrl: faker.image.url(),
          status: UserDocumentStatus.APPROVED,
        }
      });
    }
    console.log(`   ✅ Documentos criados para usuário ${user.email}`);
  }
}

/**
 * Cria DocumentTemplates (tabela vazia)
 */
async function createDocumentTemplates() {
  console.log('📝 Criando DocumentTemplates...');
  
  const existingCount = await prisma.documentTemplate.count();
  if (existingCount > 0) {
    console.log(`   Já existem ${existingCount} templates`);
    return;
  }
  
  const templates = [
    { name: 'Termo de Arrematação', category: 'ARREMATACAO', description: 'Documento formal de arrematação de lote' },
    { name: 'Contrato de Compra e Venda', category: 'CONTRATO', description: 'Contrato padrão de compra e venda' },
    { name: 'Edital de Leilão', category: 'EDITAL', description: 'Edital público do leilão' },
    { name: 'Laudo de Avaliação', category: 'LAUDO', description: 'Laudo técnico de avaliação do bem' },
    { name: 'Certidão de Débitos', category: 'CERTIDAO', description: 'Certidão negativa de débitos' },
    { name: 'Procuração', category: 'PROCURACAO', description: 'Procuração para representação em leilão' },
    { name: 'Termo de Habilitação', category: 'HABILITACAO', description: 'Termo de habilitação do arrematante' },
    { name: 'Recibo de Pagamento', category: 'PAGAMENTO', description: 'Recibo de pagamento da arrematação' },
  ];
  
  for (const tpl of templates) {
    await prisma.documentTemplate.create({
      data: {
        tenantId: TENANT_ID,
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        content: generateTemplateContent(tpl.name),
        isActive: true,
        version: 1,
        dataAiHint: `template ${tpl.name}`,
      }
    });
  }
  console.log(`   ✅ ${templates.length} templates criados`);
}

/**
 * Incrementa tabelas com poucos dados
 */
async function incrementLowDataTables() {
  console.log('📈 Incrementando tabelas com poucos dados...');
  
  // Mais LotQuestions
  await addMoreLotQuestions();
  
  // Mais Reviews
  await addMoreReviews();
  
  // Mais DirectSaleOffers
  await addMoreDirectSaleOffers();
  
  // Mais Subscribers
  await addMoreSubscribers();
  
  // Mais Notifications
  await addMoreNotifications();
  
  // Mais ContactMessages
  await addMoreContactMessages();
  
  // Mais AuditLogs
  await addMoreAuditLogs();
  
  // Mais BidderProfiles
  await addMoreBidderProfiles();
  
  // Mais Courts
  await addMoreCourts();
  
  // Mais Sellers
  await addMoreSellers();
}

async function addMoreLotQuestions() {
  const lots = await prisma.lot.findMany({ 
    take: 10,
    include: { auction: true }
  });
  const users = await prisma.user.findMany({ take: 5 });
  
  if (lots.length === 0 || users.length === 0) {
    console.log('   ⚠️ Sem lotes ou usuários para criar perguntas');
    return;
  }
  
  const questions = [
    'Qual o estado de conservação do bem?',
    'É possível agendar uma visita presencial?',
    'O bem possui todas as documentações em dia?',
    'Há débitos pendentes associados?',
    'Qual a forma de pagamento aceita?',
    'O bem pode ser retirado imediatamente após arrematação?',
    'Existem avarias não listadas?',
    'É possível parcelar o pagamento?',
  ];
  
  for (let i = 0; i < 6; i++) {
    const lot = lots[i % lots.length];
    const user = users[i % users.length];
    
    await prisma.lotQuestion.create({
      data: {
        tenantId: TENANT_ID,
        lotId: lot.id,
        auctionId: lot.auctionId,
        userId: user.id,
        userDisplayName: user.fullName || 'Usuário',
        questionText: questions[i % questions.length],
        answerText: i % 2 === 0 ? faker.lorem.paragraph() : null,
        isPublic: true,
        answeredAt: i % 2 === 0 ? new Date() : null,
      }
    });
  }
  console.log('   ✅ 6 perguntas adicionadas');
}

async function addMoreReviews() {
  const lots = await prisma.lot.findMany({ 
    take: 5,
    include: { auction: true }
  });
  const users = await prisma.user.findMany({ take: 5 });
  
  if (lots.length === 0 || users.length === 0) {
    console.log('   ⚠️ Sem lotes ou usuários para criar reviews');
    return;
  }
  
  for (let i = 0; i < 6; i++) {
    const lot = lots[i % lots.length];
    const user = users[i % users.length];
    
    await prisma.review.create({
      data: {
        tenantId: TENANT_ID,
        lotId: lot.id,
        auctionId: lot.auctionId,
        userId: user.id,
        rating: faker.number.int({ min: 3, max: 5 }),
        comment: faker.lorem.paragraph(),
        userDisplayName: user.fullName || 'Usuário',
      }
    });
  }
  console.log('   ✅ 6 reviews adicionadas');
}

async function addMoreDirectSaleOffers() {
  const categories = await prisma.lotCategory.findMany({ take: 5 });
  const sellers = await prisma.seller.findMany({ take: 3 });
  
  if (categories.length === 0 || sellers.length === 0) {
    console.log('   ⚠️ Sem categorias ou sellers para criar ofertas diretas');
    return;
  }
  
  const offerTypes = ['BUY_NOW', 'ACCEPTS_PROPOSALS'] as const;
  const statuses = ['ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'EXPIRED'] as const;
  
  for (let i = 0; i < 6; i++) {
    const category = categories[i % categories.length];
    const seller = sellers[i % sellers.length];
    
    await prisma.directSaleOffer.create({
      data: {
        tenantId: TENANT_ID,
        publicId: `dso-${Date.now()}-${i}`,
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        offerType: offerTypes[i % offerTypes.length],
        price: faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 }),
        status: statuses[i % statuses.length],
        locationCity: faker.location.city(),
        locationState: 'SP',
        categoryId: category.id,
        sellerId: seller.id,
        sellerName: seller.name,
        dataAiHint: `venda direta ${i}`,
      }
    });
  }
  console.log('   ✅ 6 ofertas diretas adicionadas');
}

async function addMoreSubscribers() {
  for (let i = 0; i < 8; i++) {
    await prisma.subscriber.create({
      data: {
        tenantId: TENANT_ID,
        email: `subscriber${Date.now()}${i}@example.com`,
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        preferences: { categories: ['Imóveis', 'Veículos'] },
      }
    });
  }
  console.log('   ✅ 8 subscribers adicionados');
}

async function addMoreNotifications() {
  const users = await prisma.user.findMany({ take: 5 });
  const lots = await prisma.lot.findMany({ 
    take: 5,
    include: { auction: true }
  });
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários para criar notificações');
    return;
  }
  
  const messages = [
    'Seu lance foi superado!',
    'O leilão começou!',
    'O leilão foi encerrado',
    'Sua habilitação foi aprovada',
    'Pagamento pendente - prazo em 48h',
    'Novo leilão disponível',
    'Arrematação confirmada',
    'Documento recebido com sucesso',
  ];
  
  for (let i = 0; i < 8; i++) {
    const user = users[i % users.length];
    const lot = lots.length > 0 ? lots[i % lots.length] : null;
    
    await prisma.notification.create({
      data: {
        tenantId: TENANT_ID,
        userId: user.id,
        lotId: lot?.id,
        auctionId: lot?.auctionId,
        message: messages[i % messages.length],
        link: lot ? `/leiloes/${lot.auctionId}/lotes/${lot.id}` : null,
        isRead: faker.datatype.boolean(),
      }
    });
  }
  console.log('   ✅ 8 notificações adicionadas');
}

async function addMoreContactMessages() {
  const subjects = ['Dúvida sobre leilão', 'Problema com pagamento', 'Sugestão', 'Reclamação', 'Solicitação de suporte'];
  
  for (let i = 0; i < 6; i++) {
    await prisma.contactMessage.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: subjects[i % subjects.length],
        message: faker.lorem.paragraph(),
        isRead: faker.datatype.boolean(),
      }
    });
  }
  console.log('   ✅ 6 mensagens de contato adicionadas');
}

async function addMoreAuditLogs() {
  const users = await prisma.user.findMany({ take: 5 });
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'] as const;
  const entities = ['Auction', 'Lot', 'Bid', 'User', 'Payment'];
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários para criar audit logs');
    return;
  }
  
  for (let i = 0; i < 10; i++) {
    const user = users[i % users.length];
    
    await prisma.auditLog.create({
      data: {
        tenantId: TENANT_ID,
        userId: user.id,
        action: actions[i % actions.length],
        entityType: entities[i % entities.length],
        entityId: BigInt(faker.number.int({ min: 1, max: 100 })),
        changes: i % 2 === 0 ? { before: { status: 'OLD' }, after: { status: 'NEW' } } : null,
        metadata: { source: 'fix-script' },
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      }
    });
  }
  console.log('   ✅ 10 audit logs adicionados');
}

async function addMoreBidderProfiles() {
  const users = await prisma.user.findMany({ 
    where: { bidderProfile: null },
    take: 6 
  });
  
  if (users.length === 0) {
    console.log('   ⚠️ Todos os usuários já possuem perfil de arrematante');
    return;
  }
  
  for (const user of users) {
    await prisma.bidderProfile.create({
      data: {
        tenantId: TENANT_ID,
        userId: user.id,
        fullName: user.fullName || faker.person.fullName(),
        cpf: faker.string.numeric(11),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: 'SP',
        zipCode: faker.location.zipCode(),
        documentStatus: 'APPROVED',
        emailNotifications: true,
        smsNotifications: false,
        isActive: true,
      }
    });
  }
  console.log(`   ✅ ${users.length} perfis de arrematante adicionados`);
}

async function addMoreCourts() {
  const courts = [
    { name: 'Tribunal de Justiça de São Paulo', acronym: 'TJSP', stateUf: 'SP' },
    { name: 'Tribunal de Justiça do Rio de Janeiro', acronym: 'TJRJ', stateUf: 'RJ' },
    { name: 'Tribunal de Justiça de Minas Gerais', acronym: 'TJMG', stateUf: 'MG' },
    { name: 'Tribunal Regional Federal da 3ª Região', acronym: 'TRF3', stateUf: 'SP' },
    { name: 'Tribunal de Justiça do Paraná', acronym: 'TJPR', stateUf: 'PR' },
  ];
  
  let created = 0;
  for (const court of courts) {
    const slug = court.acronym.toLowerCase();
    const existing = await prisma.court.findFirst({ where: { slug } });
    if (!existing) {
      await prisma.court.create({
        data: {
          slug,
          name: court.name,
          stateUf: court.stateUf,
        }
      });
      created++;
    }
  }
  console.log(`   ✅ ${created} tribunais adicionados`);
}

async function addMoreSellers() {
  const sellerData = [
    { name: 'Banco do Brasil S.A.', city: 'Brasília', state: 'DF' },
    { name: 'Caixa Econômica Federal', city: 'Brasília', state: 'DF' },
    { name: 'Santander Brasil', city: 'São Paulo', state: 'SP' },
    { name: 'Itaú Unibanco', city: 'São Paulo', state: 'SP' },
  ];
  
  let created = 0;
  for (let i = 0; i < sellerData.length; i++) {
    const data = sellerData[i];
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const existing = await prisma.seller.findFirst({ where: { slug } });
    if (!existing) {
      await prisma.seller.create({
        data: {
          tenantId: TENANT_ID,
          publicId: `seller-${Date.now()}-${i}`,
          name: data.name,
          slug,
          description: `Comitente ${data.name} - leilões de bens.`,
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          city: data.city,
          state: data.state,
          zipCode: faker.location.zipCode(),
        }
      });
      created++;
    }
  }
  console.log(`   ✅ ${created} comitentes adicionados`);
}

// Helpers
function getAssetTypeFromCategory(category: string): string {
  const mapping: Record<string, string> = {
    'Imóveis': 'IMOVEL',
    'Veículos': 'VEICULO',
    'Máquinas': 'MAQUINA',
    'Equipamentos': 'EQUIPAMENTO',
    'Arte': 'ARTE',
    'Joias': 'JOIA',
  };
  return mapping[category] || 'OUTROS';
}

function generateTemplateContent(templateName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>${templateName}</title>
</head>
<body>
  <h1>${templateName}</h1>
  <p>Data: {{data}}</p>
  <p>Leilão: {{leilao.titulo}}</p>
  <p>Lote: {{lote.numero}}</p>
  <p>Arrematante: {{arrematante.nome}}</p>
  <p>Valor: R$ {{valor}}</p>
  <hr>
  <p>Documento gerado automaticamente pelo sistema BidExpert.</p>
</body>
</html>
  `.trim();
}

main().catch(console.error);
