const mysql = require('mysql2/promise');

async function checkDatabase() {
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
    console.log('║        RELATÓRIO DE DADOS NO BANCO DE DADOS MySQL         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log('Tabela                                      | Registros');
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
      const status = count > 0 ? '✓' : '✗';
      console.log(`${status} ${table.TABLE_NAME.padEnd(38)} | ${count.toString().padStart(10)}`);
    }
    
    console.log('─'.repeat(70));
    
    // Resumo
    const tablesWithData = tableData.filter(t => t.count > 0).length;
    const emptyTables = tableData.filter(t => t.count === 0).length;
    
    console.log(`\n📊 RESUMO EXECUTIVO:`);
    console.log(`   • Total de Tabelas: ${tables.length}`);
    console.log(`   • Tabelas com Dados: ${tablesWithData}`);
    console.log(`   • Tabelas Vazias: ${emptyTables}`);
    console.log(`   • Total de Registros: ${totalRows.toLocaleString('pt-BR')}`);
    
    // Lista de tabelas vazias
    if (emptyTables > 0) {
      console.log(`\n⚠️  TABELAS VAZIAS (${emptyTables}):`);
      tableData
        .filter(t => t.count === 0)
        .forEach(t => console.log(`   • ${t.name}`));
    }
    
    // Top 10 tabelas com mais dados
    const top10 = tableData
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    if (top10.length > 0) {
      console.log(`\n🔝 TOP 10 TABELAS COM MAIS DADOS:`);
      top10.forEach((t, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${t.name.padEnd(35)} - ${t.count.toString().padStart(10)} registros`);
      });
    }
    
  } finally {
    await connection.end();
  }
}

checkDatabase().catch(err => {
  console.error('\n❌ Erro ao conectar ao banco de dados:', err.message);
  process.exit(1);
});
