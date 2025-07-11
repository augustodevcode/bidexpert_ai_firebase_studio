
// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '../src/lib/database';
import fs from 'fs';
import mysql, { type Pool } from 'mysql2/promise';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

async function executeSchema(pool: Pool) {
    console.log("\n--- [DB INIT - DDL] Executando Schema SQL ---");
    const schemaPath = path.join(process.cwd(), 'schema.mysql.sql');
    if (!fs.existsSync(schemaPath)) {
        console.warn(`[DB INIT - DDL] AVISO: Arquivo de schema não encontrado em ${schemaPath}. Pulando criação de tabelas.`);
        return;
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Split by semicolon, but handle cases where it's inside quotes or comments (basic version)
    const statements = schemaSql.split(/;\s*$/m).filter(s => s.trim().length > 0);
    
    const connection = await pool.getConnection();
    try {
        console.log("[DB INIT - DDL] Listando tabelas existentes antes da execução...");
        const [rows] = await connection.query('SHOW TABLES;');
        console.table((rows as any[]).map(row => Object.values(row)[0]));

        for (const statement of statements) {
            const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS `([^`]*)`/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'desconhecida';
            try {
                await connection.query(statement);
                console.log(`[DB INIT - DDL] ✅ SUCESSO: Tabela '${tableName}' processada.`);
            } catch (error: any) {
                console.error(`[DB INIT - DDL] ❌ ERRO na tabela '${tableName}': ${error.message}`);
            }
        }
        console.log("--- [DB INIT - DDL] Execução do Schema SQL finalizada ---");
    } catch (error) {
        console.error("[DB INIT - DDL] Erro crítico durante a execução do schema:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function seedEssentialData(db: any) {
    console.log('\n--- [DB INIT - DML] Semeando Dados Essenciais ---');
    try {
        // Platform Settings
        console.log('[DB INIT - DML] Verificando configurações da plataforma...');
        const settings = await db.getPlatformSettings();
        if (!settings) {
            console.log("[DB INIT - DML] Inserindo configurações da plataforma...");
            await db.updatePlatformSettings(samplePlatformSettings);
            console.log("[DB INIT - DML] ✅ SUCESSO: Configurações da plataforma inseridas.");
        } else {
            console.log("[DB INIT - DML] INFO: Configurações da plataforma já existem. Pulando.");
        }

        // Roles
        console.log("[DB INIT - DML] Verificando perfis (roles)...");
        const roles = await db.getRoles();
        if (!roles || roles.length === 0) {
            console.log("[DB INIT - DML] Populando perfis (roles)...");
            if (db.createRole) {
                for (const role of sampleRoles) await db.createRole(role);
                console.log(`[DB INIT - DML] ✅ SUCESSO: ${sampleRoles.length} roles inseridos.`);
            }
        } else {
            console.log("[DB INIT - DML] INFO: Perfis (Roles) já existem. Pulando.");
        }
    } catch (error: any) {
        console.error(`[DB INIT - DML] ❌ ERRO ao semear dados essenciais: ${error.message}`);
    }
    
    console.log('--- [DB INIT - DML] Semeadura de Dados Essenciais Finalizada ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] Iniciando script de inicialização do banco de dados...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM;
  console.log(`[DB INIT] Sistema de banco de dados ativo: ${activeSystem}`);


  if (activeSystem !== 'MYSQL' && activeSystem !== 'POSTGRES') {
      console.log(`[DB INIT] 🟡 Pulando inicialização para o sistema: ${activeSystem}.`);
      return;
  }
  
  const dbUrl = activeSystem === 'MYSQL' ? process.env.DATABASE_URL : process.env.POSTGRES_DATABASE_URL;
  if (!dbUrl) {
      console.error(`[DB INIT] ❌ ERRO: A variável de ambiente para ${activeSystem} não está configurada.`);
      process.exit(1);
  }

  let pool: Pool | null = null;
  try {
      if (activeSystem === 'MYSQL') {
          pool = mysql.createPool(dbUrl);
          const connection = await pool.getConnection();
          console.log(`[DB INIT] 🔌 Conexão com o banco de dados MySQL estabelecida com sucesso.`);
          connection.release();
          await executeSchema(pool);
      }
      // Adicionar lógica para PostgreSQL se necessário no futuro

      const db = getDatabaseAdapter();
      await seedEssentialData(db);

  } catch (error) {
      console.error("[DB INIT] ❌ ERRO FATAL durante a inicialização do banco de dados:", error);
      process.exit(1);
  } finally {
      if (pool) {
          await pool.end();
          console.log("[DB INIT] 🔌 Pool de conexões do banco de dados para o script foi fechado.");
      }
      console.log("✅ [DB INIT] Script de inicialização finalizado.");
  }
}

initializeDatabase();
