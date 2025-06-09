
// scripts/initialize-db.ts
import 'dotenv/config'; // Carrega variáveis de .env
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { PostgresAdapter } from '../src/lib/database/postgres.adapter';
import { MySqlAdapter } from '../src/lib/database/mysql.adapter';
import type { IDatabaseAdapter } from '../src/types';

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

  if (dbType === 'postgres') {
    if (!process.env.POSTGRES_CONNECTION_STRING) {
      console.error('Erro: A variável de ambiente POSTGRES_CONNECTION_STRING não está definida.');
      process.exit(1);
    }
    dbAdapter = new PostgresAdapter();
  } else if (dbType === 'mysql') {
    if (!process.env.MYSQL_CONNECTION_STRING) {
      console.error('Erro: A variável de ambiente MYSQL_CONNECTION_STRING não está definida.');
      process.exit(1);
    }
    dbAdapter = new MySqlAdapter();
  } else {
    console.error('Tipo de banco de dados inválido. Use "postgres" ou "mysql".');
    process.exit(1);
  }

  try {
    console.log(`Conectando ao banco de dados ${dbType.toUpperCase()}...`);
    // A conexão é estabelecida dentro dos métodos do adapter
    const result = await dbAdapter.initializeSchema();

    if (result.success) {
      console.log(`\n${result.message}`);
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
    // Se seus adaptadores mantiverem um pool que precisa ser fechado explicitamente após o script,
    // você adicionaria a lógica de fechamento aqui. Ex: await (dbAdapter as any).closePool?.();
    console.log(`--- Processo de Inicialização para ${dbType.toUpperCase()} Concluído ---`);
    // Adicionado process.exit para garantir que o script termine, especialmente útil se pools não são fechados.
    process.exit(0); 
  }
}

main().catch(error => {
  console.error("Erro inesperado no script initialize-db:", error);
  process.exit(1);
});
