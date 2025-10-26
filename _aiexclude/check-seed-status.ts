import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function checkSeedStatus() {
  console.log('🔍 Verificando status do seed no banco de dados...\n');

  const tables = [
    'Tenant', 'Role', 'User', 'UsersOnRoles', 'UsersOnTenants',
    'LotCategory', 'Subcategory',
    'State', 'City',
    'Court', 'JudicialDistrict', 'JudicialBranch', 'JudicialProcess', 'JudicialParty',
    'Seller', 'Auctioneer',
    'Asset', 'Auction', 'AuctionStage', 'Lot', 'AssetsOnLots',
    'Bid', 'UserLotMaxBid', 'AuctionHabilitation',
    'UserWin', 'InstallmentPayment', '_InstallmentPaymentToLot',
    'LotQuestion', 'Review', 'Notification', 'Subscriber',
    'DocumentType', 'UserDocument', 'DocumentTemplate',
    'MediaItem',
    'VehicleMake', 'VehicleModel',
    'DirectSaleOffer',
    'ContactMessage',
    'PlatformSettings',
    'data_sources', 'reports',
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
      console.log(`⚠️  Erro ao consultar tabela "${table}": ${error.message}`);
    }
  }

  console.log('📊 RESUMO DA ANÁLISE:\n');
  console.log(`✅ Tabelas Populadas: ${populatedTables.length}/${tables.length} (${Math.round((populatedTables.length / tables.length) * 100)}%)`);
  console.log(`❌ Tabelas Vazias: ${emptyTables.length}/${tables.length} (${Math.round((emptyTables.length / tables.length) * 100)}%)\n`);

  if (populatedTables.length > 0) {
    console.log('✅ TABELAS POPULADAS:');
    populatedTables.forEach(table => {
      console.log(`  ✓ ${table.padEnd(35)} - ${results[table].toString().padStart(5)} registros`);
    });
  }

  if (emptyTables.length > 0) {
    console.log('\n❌ TABELAS VAZIAS (não populadas pelo seed):');
    emptyTables.forEach(table => {
      console.log(`  ✗ ${table}`);
    });
  }

  // Análise por categoria
  const categories = {
    'Core (Tenant, Roles, Users)': ['Tenant', 'Role', 'User', 'UsersOnRoles', 'UsersOnTenants'],
    'Categorias e Subcategorias': ['LotCategory', 'Subcategory'],
    'Localização': ['State', 'City'],
    'Judicial': ['Court', 'JudicialDistrict', 'JudicialBranch', 'JudicialProcess', 'JudicialParty'],
    'Participantes': ['Seller', 'Auctioneer'],
    'Ativos e Leilões': ['Asset', 'Auction', 'AuctionStage', 'Lot', 'AssetsOnLots'],
    'Lances e Habilitação': ['Bid', 'UserLotMaxBid', 'AuctionHabilitation'],
    'Arrematações e Pagamentos': ['UserWin', 'InstallmentPayment', '_InstallmentPaymentToLot'],
    'Interações': ['LotQuestion', 'Review', 'Notification', 'Subscriber'],
    'Documentos': ['DocumentType', 'UserDocument', 'DocumentTemplate'],
    'Mídia': ['MediaItem'],
    'Veículos': ['VehicleMake', 'VehicleModel'],
    'Vendas Diretas': ['DirectSaleOffer'],
    'Mensagens': ['ContactMessage'],
    'Configurações': ['PlatformSettings'],
    'Relatórios': ['data_sources', 'reports'],
    'Relacionamentos Many-to-Many': ['_AuctionToCourt', '_AuctionToJudicialBranch', '_AuctionToJudicialDistrict', '_AuctionToLotCategory'],
  };

  console.log('\n\n📋 ANÁLISE POR CATEGORIA:\n');
  for (const [category, categoryTables] of Object.entries(categories)) {
    const populated = categoryTables.filter(t => populatedTables.includes(t)).length;
    const total = categoryTables.length;
    const percentage = Math.round((populated / total) * 100);
    const status = percentage === 100 ? '✅' : percentage > 0 ? '⚠️' : '❌';
    
    console.log(`${status} ${category}: ${populated}/${total} (${percentage}%)`);
    
    const missing = categoryTables.filter(t => emptyTables.includes(t));
    if (missing.length > 0) {
      console.log(`   Faltam: ${missing.join(', ')}`);
    }
  }

  // Gerar relatório
  const report = `# Análise de Cobertura do Seed - BidExpert
**Data:** ${new Date().toLocaleString('pt-BR')}

## 📊 Resumo Geral
- **Total de Tabelas:** ${tables.length}
- **Tabelas Populadas:** ${populatedTables.length} (${Math.round((populatedTables.length / tables.length) * 100)}%)
- **Tabelas Vazias:** ${emptyTables.length} (${Math.round((emptyTables.length / tables.length) * 100)}%)

## ✅ Tabelas Populadas (${populatedTables.length})

| Tabela | Registros |
|--------|-----------|
${populatedTables.map(t => `| ${t} | ${results[t]} |`).join('\n')}

## ❌ Tabelas Vazias (${emptyTables.length})

${emptyTables.map(t => `- ${t}`).join('\n')}

## 📋 Análise por Categoria

${Object.entries(categories).map(([category, categoryTables]) => {
  const populated = categoryTables.filter(t => populatedTables.includes(t)).length;
  const total = categoryTables.length;
  const percentage = Math.round((populated / total) * 100);
  const status = percentage === 100 ? '✅' : percentage > 0 ? '⚠️' : '❌';
  const missing = categoryTables.filter(t => emptyTables.includes(t));
  
  return `### ${status} ${category}
- **Cobertura:** ${populated}/${total} (${percentage}%)
${missing.length > 0 ? `- **Faltam:** ${missing.join(', ')}` : '- **Status:** Completo'}
`;
}).join('\n')}

## 🎯 Comparação com TESTING_SCENARIOS.md

### Cenários que Requerem Dados Específicos:

#### ✅ Módulo 1: Administração - Gerenciamento de Entidades (CRUD)
- Requer: User, Role, Auction, Lot, Asset
- Status: ${['User', 'Role', 'Auction', 'Lot', 'Asset'].every(t => populatedTables.includes(t)) ? '✅ Completo' : '❌ Incompleto'}

#### ${['AuctionHabilitation', 'UserDocument'].every(t => populatedTables.includes(t)) ? '✅' : '❌'} Módulo 2: Fluxo de Habilitação de Usuário
- Requer: User, DocumentType, UserDocument, AuctionHabilitation
- Status: ${['User', 'DocumentType', 'UserDocument', 'AuctionHabilitation'].every(t => populatedTables.includes(t)) ? '✅ Completo' : '❌ Incompleto'}

#### ${['Bid', 'UserWin'].every(t => populatedTables.includes(t)) ? '✅' : '❌'} Módulo 3: Jornada do Arrematante (Lances e Compras)
- Requer: Lot, Bid, UserWin, InstallmentPayment
- Status: ${['Lot', 'Bid', 'UserWin', 'InstallmentPayment'].every(t => populatedTables.includes(t)) ? '✅ Completo' : '❌ Incompleto'}

#### ${['VehicleMake', 'VehicleModel'].every(t => populatedTables.includes(t)) ? '✅' : '❌'} Dados de Veículos
- Requer: VehicleMake, VehicleModel
- Status: ${['VehicleMake', 'VehicleModel'].every(t => populatedTables.includes(t)) ? '✅ Completo' : '❌ Incompleto'}

## 🚀 Recomendações

### Prioridade Alta (Tabelas Críticas Vazias):
${emptyTables.filter(t => 
  ['AuctionHabilitation', 'UserLotMaxBid', 'Bid', 'UserWin', 'InstallmentPayment', 
   'LotQuestion', 'Review', 'Subscriber', 'MediaItem', 'VehicleMake', 'VehicleModel',
   '_AuctionToCourt', '_AuctionToJudicialBranch', '_AuctionToJudicialDistrict', '_AuctionToLotCategory',
   '_InstallmentPaymentToLot'].includes(t)
).map(t => `- **${t}**: Necessário para testes completos`).join('\n') || '- Nenhuma tabela crítica vazia'}

### Próximos Passos:
1. ✅ Corrigir erros de tipo no script seed-data-extended.ts
2. ⚠️  Adicionar seed para tabelas vazias identificadas
3. ⚠️  Verificar relacionamentos many-to-many
4. ⚠️  Garantir dados suficientes para todos os cenários do TESTING_SCENARIOS.md
5. ⚠️  Executar testes Playwright para validar cobertura
`;

  fs.writeFileSync('SEED_STATUS_REPORT.md', report);
  console.log('\n\n📄 Relatório completo salvo em: SEED_STATUS_REPORT.md');
}

checkSeedStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
