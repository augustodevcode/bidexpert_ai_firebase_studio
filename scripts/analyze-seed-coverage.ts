/**
 * Script para analisar quais tabelas estão sendo populadas pelo seed
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function analyzeSeedCoverage() {
  console.log('🔍 Analisando cobertura do seed no banco de dados...\n');

  const tables = [
    // Core
    'tenant', 'role', 'user', '_UserToRole',
    
    // Categories
    'lotCategory', 'subcategory',
    
    // Location
    'state', 'city',
    
    // Judicial
    'court', 'judicialDistrict', 'judicialBranch', 'judicialProcess', 'processParty',
    
    // Participants
    'seller', 'auctioneer',
    
    // Assets & Lots
    'asset', 'auction', 'auctionStage', 'lot', '_AssetToLot',
    
    // Bidding
    'bid', 'userLotMaxBid', 'auctionHabilitation',
    
    // Wins & Payments
    'userWin', 'installmentPayment', '_InstallmentPaymentToLot',
    
    // Interactions
    'lotQuestion', 'review', 'notification', 'subscriber',
    
    // Documents
    'documentType', 'userDocument', 'documentTemplate',
    
    // Media
    'mediaItem',
    
    // Vehicles
    'vehicleMake', 'vehicleModel',
    
    // Direct Sales
    'directSaleOffer',
    
    // Messages
    'contactMessage',
    
    // Settings
    'platformSettings',
    
    // Reports
    'data_sources', 'reports',
    
    // Many-to-Many relationships
    '_AuctionToCourt', '_AuctionToJudicialBranch', '_AuctionToJudicialDistrict', '_AuctionToLotCategory',
  ];

  const results: Record<string, number> = {};
  const emptyTables: string[] = [];
  const populatedTables: string[] = [];

  for (const table of tables) {
    try {
      const count = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM \`${table}\``);
      const tableCount = Number(count[0].count);
      results[table] = tableCount;
      
      if (tableCount === 0) {
        emptyTables.push(table);
      } else {
        populatedTables.push(table);
      }
    } catch (error: any) {
      results[table] = -1; // Table doesn't exist
      console.log(`⚠️  Tabela "${table}" não existe no banco`);
    }
  }

  console.log('\n📊 RESUMO DA ANÁLISE:\n');
  console.log(`✅ Tabelas Populadas: ${populatedTables.length}/${tables.length}`);
  console.log(`❌ Tabelas Vazias: ${emptyTables.length}/${tables.length}\n`);

  console.log('📋 TABELAS POPULADAS:');
  populatedTables.forEach(table => {
    console.log(`  ✓ ${table.padEnd(35)} - ${results[table]} registros`);
  });

  if (emptyTables.length > 0) {
    console.log('\n⚠️  TABELAS VAZIAS (não populadas pelo seed):');
    emptyTables.forEach(table => {
      console.log(`  ✗ ${table}`);
    });
  }

  // Gerar relatório em Markdown
  const report = `# Análise de Cobertura do Seed - BidExpert

## Resumo
- **Total de Tabelas Analisadas:** ${tables.length}
- **Tabelas Populadas:** ${populatedTables.length} (${Math.round((populatedTables.length / tables.length) * 100)}%)
- **Tabelas Vazias:** ${emptyTables.length} (${Math.round((emptyTables.length / tables.length) * 100)}%)

## Tabelas Populadas

${populatedTables.map(t => `- **${t}**: ${results[t]} registros`).join('\n')}

## Tabelas Vazias (Faltam no Seed)

${emptyTables.map(t => `- ${t}`).join('\n')}

## Recomendações

### Tabelas Críticas Faltantes:
${emptyTables.filter(t => 
  t.includes('Habilitation') || 
  t.includes('MaxBid') || 
  t.includes('Subscriber') || 
  t.includes('_Auction') ||
  t.includes('_Installment')
).map(t => `- **${t}**: Necessário para testes completos`).join('\n') || '- Nenhuma tabela crítica faltando'}

### Próximos Passos:
1. Adicionar seed para tabelas vazias identificadas
2. Verificar relacionamentos many-to-many
3. Garantir dados suficientes para cenários de teste do TESTING_SCENARIOS.md
`;

  fs.writeFileSync('SEED_COVERAGE_ANALYSIS.md', report);
  console.log('\n📄 Relatório salvo em: SEED_COVERAGE_ANALYSIS.md');
}

analyzeSeedCoverage()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
