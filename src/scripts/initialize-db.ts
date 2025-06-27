
// scripts/initialize-db.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { PostgresAdapter } from '../src/lib/database/postgres.adapter';
import { MySqlAdapter } from '../src/lib/database/mysql.adapter';
import type { IDatabaseAdapter } from '../src/types';

// Determine the environment and load the appropriate .env file
const envPathLocal = path.resolve(process.cwd(), '.env.local');
const envPathGlobal = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPathLocal)) {
  console.log(`[DB Init Script] Carregando variáveis de ambiente de: ${envPathLocal}`);
  dotenv.config({ path: envPathLocal });
} else if (fs.existsSync(envPathGlobal)) {
  console.log(`[DB Init Script] .env.local não encontrado. Carregando variáveis de ambiente de: ${envPathGlobal}`);
  dotenv.config({ path: envPathGlobal });
} else {
  console.warn('[DB Init Script] Nenhum arquivo .env ou .env.local encontrado na raiz do projeto. As variáveis de ambiente devem ser definidas globalmente.');
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('db', {
      alias: 'database',
      type: 'string',
      description: 'Specify the database type to initialize (postgres or mysql)',
      choices: ['postgres', 'mysql'],
      demandOption: true,
    })
    .help()
    .alias('help', 'h')
    .argv;

  let dbAdapter: IDatabaseAdapter;
  const dbType = argv.db as 'postgres' | 'mysql';

  console.log(`--- Iniciando Inicialização de Esquema para Banco de Dados: ${dbType.toUpperCase()} ---`);

  const postgresConnectionString = process.env.POSTGRES_CONNECTION_STRING;
  const mysqlConnectionString = process.env.MYSQL_CONNECTION_STRING;

  console.log(`[DB Init Script] Valor lido para POSTGRES_CONNECTION_STRING: ${postgresConnectionString ? "'Presente (oculto por segurança)'" : "'AUSENTE'"}`);
  console.log(`[DB Init Script] Valor lido para MYSQL_CONNECTION_STRING: ${mysqlConnectionString ? "'Presente (oculto por segurança)'" : "'AUSENTE'"}`);


  if (dbType === 'postgres') {
    if (!postgresConnectionString) {
      console.error('Erro: A variável de ambiente POSTGRES_CONNECTION_STRING não está definida ou não foi carregada corretamente.');
      process.exit(1);
    }
    dbAdapter = new PostgresAdapter();
  } else if (dbType === 'mysql') {
    if (!mysqlConnectionString) {
      console.error('Erro: A variável de ambiente MYSQL_CONNECTION_STRING não está definida ou não foi carregada corretamente.');
      process.exit(1);
    }
    dbAdapter = new MySqlAdapter();
  } else {
    console.error('Tipo de banco de dados inválido. Use "postgres" ou "mysql".');
    process.exit(1);
  }

  try {
    console.log(`Conectando ao banco de dados ${dbType.toUpperCase()}...`);
    const result = await dbAdapter.initializeSchema();

    if (result.success) {
      console.log(`\n${result.message}`);
      if (result.rolesProcessed !== undefined) {
        console.log(`[DB Init Script] ${result.rolesProcessed} perfis padrão foram processados (criados/atualizados).`);
      }
      console.log(`[DB Init Script] As tabelas (exceto 'roles' e 'platform_settings') são criadas vazias. Use scripts de seed específicos para popular com dados de exemplo.`);
    } else {
      console.error(`\nFalha ao inicializar o esquema para ${dbType.toUpperCase()}: ${result.message}`);
      if (result.errors && result.errors.length > 0) {
        console.error('Detalhes dos erros:');
        result.errors.forEach((err, index) => {
          console.error(`  Erro ${index + 1}:`, err);
        });
      }
    }
  } catch (error: any) {
    console.error(`Erro crítico durante a inicialização do esquema para ${dbType.toUpperCase()}:`, error);
    if (error.code) {
        console.error(`Código do Erro: ${error.code}`);
    }
  } finally {
    console.log(`--- Processo de Inicialização para ${dbType.toUpperCase()} Concluído ---`);
    // Garantir que o pool de conexão seja encerrado para que o script finalize.
    // Isso é mais relevante para o pool 'pg' do que para o 'mysql2/promise' que gerencia conexões de forma diferente.
    // No entanto, uma função de desconexão explícita no adaptador seria mais limpa.
    if (typeof (dbAdapter as any).disconnect === 'function') {
        await (dbAdapter as any).disconnect();
        console.log(`[DB Init Script] Conexão com o banco de dados ${dbType.toUpperCase()} encerrada.`);
    }
    process.exit(0); 
  }
}

main().catch(error => {
  console.error("Erro inesperado no script initialize-db:", error);
  process.exit(1);
});
