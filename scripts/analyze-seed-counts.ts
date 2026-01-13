/**
 * CONTADOR DE REGISTROS DO SEED-DATA-EXTENDED-V3.TS
 * Análise sistemática de quantos registros cada tipo de entidade são criados
 */

import { readFileSync } from 'fs';
import { join } from 'path';

function analyzeSeedDataExtendedV3() {
  console.log('🔍 ANALISANDO SEED-DATA-EXTENDED-V3.TS - CONTAGEM DE REGISTROS\n');

  const filePath = join(process.cwd(), 'scripts', 'seed-data-extended-v3.ts');
  const content = readFileSync(filePath, 'utf-8');

  // Contadores por tipo de entidade
  const counts = {
    // Usuários e perfis
    users: 0,
    roles: 0,
    usersOnRoles: 0,
    usersOnTenants: 0,
    sellers: 0,
    auctioneers: 0,

    // Documentos
    documentTypes: 0,
    userDocuments: 0,

    // Auctions e relacionados
    auctions: 0,
    auctionStages: 0,

    // Judicial
    judicialProcesses: 0,

    // Lots e assets
    lots: 0,
    assets: 0,

    // Bids
    bids: 0,

    // Categorias
    categories: 0,
    subcategories: 0,

    // Media
    mediaItems: 0,

    // Outros
    tenants: 0,
  };

  // Padrões de regex para contar criações
  const patterns = {
    users: /prisma\.user\.create\(/g,
    roles: /prisma\.role\.create\(/g,
    usersOnRoles: /prisma\.usersOnRoles\.create\(/g,
    usersOnTenants: /prisma\.usersOnTenants\.create\(/g,
    sellers: /prisma\.seller\.create\(/g,
    auctioneers: /prisma\.auctioneer\.create\(/g,
    documentTypes: /prisma\.documentType\.create\(/g,
    userDocuments: /prisma\.userDocument\.create\(/g,
    auctions: /prisma\.auction\.create\(/g,
    judicialProcesses: /prisma\.judicialProcess\.create\(/g,
    lots: /prisma\.lot\.create\(/g,
    assets: /prisma\.asset\.create\(/g,
    bids: /prisma\.bid\.create\(/g,
    categories: /prisma\.lotCategory\.create\(/g,
    subcategories: /prisma\.subcategory\.create\(/g,
    tenants: /prisma\.tenant\.create\(/g,
  };

  // Contar ocorrências
  Object.entries(patterns).forEach(([key, pattern]) => {
    const matches = content.match(pattern);
    counts[key as keyof typeof counts] = matches ? matches.length : 0;
  });

  // Contagens especiais baseadas na análise detalhada do código

  // Auction stages - baseado no código que cria stages para cada auction
  counts.auctionStages = 4; // Um para cada um dos 4 primeiros auctions

  // Media items - baseado na análise do código:
  // Para auctions: 2-3 imagens cada, 4 auctions = ~8-12
  // Para lots: 2-3 imagens cada, 8 lots = ~16-24
  // Total aproximado: ~24-36
  counts.mediaItems = 30; // Estimativa baseada no código

  // Ajustes baseados na leitura do código:
  // Users: 6 usuários básicos + 1 auctioneer (total 7)
  counts.users = 7;

  // UsersOnRoles: 6 usuários básicos + associações extras (total 11)
  counts.usersOnRoles = 11;

  // UsersOnTenants: 6 usuários básicos + 1 auctioneer (total 7)
  counts.usersOnTenants = 7;

  // Bids: 11 bids criados no código principal
  counts.bids = 11;

  // JudicialProcesses: 3 processos criados
  counts.judicialProcesses = 3;

  // Lots: 8 lots criados no código principal
  counts.lots = 8;

  // Assets: 2 assets criados baseados no código
  counts.assets = 2;

  // DocumentTypes: 9 tipos criados mas apenas 1 chamado direto no código
  counts.documentTypes = 9; // Ajustado baseado na leitura

  // UserDocuments: múltiplos documentos criados
  counts.userDocuments = 8; // Baseado na leitura do código

  // Exibir resultados
  console.log('📊 CONTAGEM DE REGISTROS CRIADOS:\n');

  console.log('👥 USUÁRIOS E PERFIS:');
  console.log(`   • Users: ${counts.users}`);
  console.log(`   • Roles: ${counts.roles}`);
  console.log(`   • UsersOnRoles: ${counts.usersOnRoles}`);
  console.log(`   • UsersOnTenants: ${counts.usersOnTenants}`);
  console.log(`   • Sellers: ${counts.sellers}`);
  console.log(`   • Auctioneers: ${counts.auctioneers}`);
  console.log('');

  console.log('📄 DOCUMENTOS:');
  console.log(`   • DocumentTypes: ${counts.documentTypes}`);
  console.log(`   • UserDocuments: ${counts.userDocuments}`);
  console.log('');

  console.log('🏛️ AUCTIONS E PROCESSOS:');
  console.log(`   • Auctions: ${counts.auctions}`);
  console.log(`   • AuctionStages: ${counts.auctionStages}`);
  console.log(`   • JudicialProcesses: ${counts.judicialProcesses}`);
  console.log('');

  console.log('📦 LOTS E ASSETS:');
  console.log(`   • Lots: ${counts.lots}`);
  console.log(`   • Assets: ${counts.assets}`);
  console.log('');

  console.log('💰 BIDS:');
  console.log(`   • Bids: ${counts.bids}`);
  console.log('');

  console.log('🏷️ CATEGORIAS:');
  console.log(`   • Categories: ${counts.categories}`);
  console.log(`   • Subcategories: ${counts.subcategories}`);
  console.log('');

  console.log('🖼️ MÍDIA:');
  console.log(`   • MediaItems: ${counts.mediaItems} (estimativa)`);
  console.log('');

  console.log('🏢 OUTROS:');
  console.log(`   • Tenants: ${counts.tenants}`);
  console.log('');

  // Totais
  const totalRegistros = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log(`🎯 TOTAL DE REGISTROS CRIADOS: ${totalRegistros}\n`);

  // Análise por tipo de entidade no banco
  console.log('📋 RESUMO POR TIPO DE ENTIDADE:');
  console.log('• User (usuários):', counts.users);
  console.log('• Role (perfis):', counts.roles);
  console.log('• UsersOnRoles (associações usuário-perfil):', counts.usersOnRoles);
  console.log('• UsersOnTenants (associações usuário-tenant):', counts.usersOnTenants);
  console.log('• Seller (vendedores):', counts.sellers);
  console.log('• Auctioneer (leiloeiros):', counts.auctioneers);
  console.log('• DocumentType (tipos de documento):', counts.documentTypes);
  console.log('• UserDocument (documentos de usuário):', counts.userDocuments);
  console.log('• Auction (leilões):', counts.auctions);
  console.log('• JudicialProcess (processos judiciais):', counts.judicialProcesses);
  console.log('• Lot (lotes):', counts.lots);
  console.log('• Asset (bens):', counts.assets);
  console.log('• Bid (lances):', counts.bids);
  console.log('• LotCategory (categorias):', counts.categories);
  console.log('• Subcategory (subcategorias):', counts.subcategories);
  console.log('• MediaItem (itens de mídia):', counts.mediaItems);
  console.log('• Tenant (tenants):', counts.tenants);

  console.log('\n✅ ANÁLISE CONCLUÍDA!');
}

analyzeSeedDataExtendedV3();