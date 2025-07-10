// scripts/init-db.ts
// Este script serve como um exemplo de como inicializar o banco de dados.
// Ele deve ser adaptado para o banco de dados SQL específico (PostgreSQL ou MySQL).

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg'; // Exemplo para PostgreSQL

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const createTablesSQL = `
  -- Este é um exemplo de SQL para PostgreSQL. Adapte para MySQL se necessário.
  -- A criação de tabelas agora deve ser gerenciada pelas migrações do Prisma.
  -- Este arquivo é mantido como referência ou para scripts de inicialização específicos
  -- que não são cobertos pelo Prisma Migrate.

  CREATE TABLE IF NOT EXISTS "Test" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL
  );

  -- Adicione aqui a criação de outras tabelas se não estiverem no schema.prisma.
`;

async function initializeDatabase() {
  const connectionString = process.env.POSTGRES_DATABASE_URL;
  if (!connectionString) {
    console.error('POSTGRES_DATABASE_URL não está definida no arquivo .env.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log('Conectado ao banco de dados com sucesso.');

    console.log('Executando script de criação de tabelas...');
    await client.query(createTablesSQL);
    console.log('Tabelas criadas ou já existentes.');
    
    // Aqui você poderia adicionar lógicas para popular tabelas essenciais (como 'roles')
    // que não fazem parte do 'seed' de dados de exemplo.

    client.release();
    console.log('Inicialização do banco de dados concluída.');
    process.exit(0);

  } catch (error) {
    console.error('Erro durante a inicialização do banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
