const mysql = require('mysql2/promise');

async function checkDatabaseChanges() {
  const connection = await mysql.createConnection({
    host: 'bidxprtmsqfire.mysql.dbaas.com.br',
    user: 'bidxprtmsqfire',
    password: 'xL6cqPhigY5cx!',
    database: 'bidxprtmsqfire'
  });

  try {
    const [tables] = await connection.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME'
    );
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║        VERIFICAÇÃO DE MUDANÇAS - BANCO DE DADOS MySQL     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log(`Timestamp: ${new Date().toLocaleString('pt-BR')}`);
    console.log('─'.repeat(70));
    
    let totalRows = 0;
    const tableData = [];
    
    for (const table of tables) {
      const [[{ count }]] = await connection.execute(
        `SELECT COUNT(*) as count FROM \`${table.TABLE_NAME}\``
      );
      totalRows += count;
      tableData.push({
        name: table.TABLE_NAME,
        count: count
      });
    }
    
    // Dados da consulta anterior
    const previousData = {
      'Asset': 101,
      'AssetMedia': 0,
      'AssetsOnLots': 364,
      'Auction': 49,
      'Auctioneer': 4,
      'AuctionHabilitation': 120,
      'AuctionStage': 12,
      'Bid': 84,
      'bidder_notifications': 0,
      'bidder_profiles': 0,
      'BiddingSettings': 0,
      'City': 10,
      'ContactMessage': 15,
      'Court': 12,
      'DataSource': 0,
      'DirectSaleOffer': 0,
      'DocumentTemplate': 0,
      'DocumentType': 5,
      'IdMasks': 0,
      'InstallmentPayment': 175,
      'JudicialBranch': 25,
      'JudicialDistrict': 56,
      'JudicialParty': 129,
      'JudicialProcess': 15,
      'Lot': 148,
      'LotCategory': 3,
      'LotQuestion': 0,
      'LotStagePrice': 0,
      'MapSettings': 0,
      'MediaItem': 50,
      'MentalTriggerSettings': 0,
      'Notification': 0,
      'NotificationSettings': 0,
      'participation_history': 0,
      'PasswordResetToken': 0,
      'PaymentGatewaySettings': 0,
      'payment_methods': 0,
      'PlatformSettings': 4,
      'Report': 0,
      'Review': 0,
      'Role': 6,
      'SectionBadgeVisibility': 0,
      'Seller': 11,
      'State': 27,
      'Subcategory': 5,
      'Subscriber': 0,
      'Tenant': 3,
      'ThemeColors': 0,
      'ThemeSettings': 0,
      'User': 5,
      'UserDocument': 11,
      'UserLotMaxBid': 0,
      'UsersOnRoles': 167,
      'UsersOnTenants': 245,
      'UserWin': 27,
      'VariableIncrementRule': 0,
      'VehicleMake': 10,
      'VehicleModel': 30,
      'won_lots': 0
    };
    
    console.log('\nTabela                                      | Anterior | Atual | Mudança');
    console.log('─'.repeat(90));
    
    let totalChanges = 0;
    const changes = [];
    
    for (const table of tableData) {
      const anterior = previousData[table.name] !== undefined ? previousData[table.name] : '?';
      const mudanca = anterior !== '?' ? table.count - anterior : 0;
      
      if (mudanca !== 0) {
        totalChanges += Math.abs(mudanca);
        const statusIcon = mudanca > 0 ? '📈' : mudanca < 0 ? '📉' : '→';
        changes.push({
          name: table.name,
          anterior: anterior,
          atual: table.count,
          mudanca: mudanca
        });
        console.log(`${statusIcon} ${table.name.padEnd(38)} | ${anterior.toString().padStart(8)} | ${table.count.toString().padStart(5)} | ${mudanca > 0 ? '+' : ''}${mudanca}`);
      }
    }
    
    if (changes.length === 0) {
      console.log('→ Nenhuma mudança detectada em qualquer tabela.');
    }
    
    console.log('─'.repeat(90));
    
    // Resumo
    const tablesWithData = tableData.filter(t => t.count > 0).length;
    const previousTablesWithData = Object.values(previousData).filter(v => v > 0).length;
    
    console.log(`\n📊 ANÁLISE COMPARATIVA:`);
    console.log(`   Consulta Anterior:    34 tabelas com dados | ${1931} registros totais`);
    console.log(`   Consulta Atual:       ${tablesWithData} tabelas com dados | ${totalRows.toLocaleString('pt-BR')} registros totais`);
    console.log(`   Mudança:              ${tablesWithData - previousTablesWithData > 0 ? '+' : ''}${tablesWithData - previousTablesWithData} tabelas | ${totalRows - 1931 > 0 ? '+' : ''}${(totalRows - 1931).toLocaleString('pt-BR')} registros`);
    
    if (changes.length > 0) {
      console.log(`\n⚠️  MUDANÇAS DETECTADAS (${changes.length} tabelas):`);
      changes.forEach(change => {
        console.log(`   • ${change.name}: ${change.anterior} → ${change.atual} (${change.mudanca > 0 ? '+' : ''}${change.mudanca})`);
      });
    } else {
      console.log(`\n✓ NENHUMA MUDANÇA DETECTADA - Dados estáveis`);
    }
    
  } finally {
    await connection.end();
  }
}

checkDatabaseChanges().catch(err => {
  console.error('\n❌ Erro ao conectar ao banco de dados:', err.message);
  process.exit(1);
});
