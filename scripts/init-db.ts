// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '../src/lib/database'; // Corrigido o caminho
import fs from 'fs';
import mysql, { type Pool } from 'mysql2/promise';
import { sampleRoles, samplePlatformSettings, sampleLotCategories, sampleSubcategories, sampleStates, sampleCities, sampleCourts, sampleJudicialDistricts, sampleJudicialBranches } from '../src/lib/sample-data';


// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

async function executeSchema(pool: Pool) {
    console.log("--- Executando Schema SQL ---");
    const schemaPath = path.join(process.cwd(), 'schema.mysql.sql');
    if (!fs.existsSync(schemaPath)) {
        console.warn(`AVISO: Arquivo de schema não encontrado em ${schemaPath}. Pulando criação de tabelas.`);
        return;
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql.split(/;\s*$/m).filter(s => s.trim().length > 0);
    
    const connection = await pool.getConnection();
    try {
        console.log("Listando tabelas existentes antes da execução...");
        const [rows] = await connection.query('SHOW TABLES;');
        const existingTables = (rows as any[]).map(row => Object.values(row)[0]);
        console.table(existingTables);

        for (const statement of statements) {
            const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS `([^`]*)`/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'desconhecida';
            try {
                await connection.query(statement);
                console.log(`✅ SUCESSO: Tabela '${tableName}' criada ou já existente.`);
            } catch (error: any) {
                console.error(`❌ ERRO ao executar para a tabela '${tableName}': ${error.message}`);
                // Decidir se quer parar ou continuar em caso de erro. Por enquanto, continua.
            }
        }
        console.log("--- Execução do Schema SQL finalizada ---");
    } catch (error) {
        console.error("Erro crítico durante a execução do schema:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function seedEssentialData(db: any) {
    console.log('\n--- Semeando Dados Essenciais ---');
    // Check if seeding is necessary by looking for roles
    const roles = await db.getRoles();
    if (roles && roles.length > 0) {
        console.log("Dados essenciais (Perfis) já existem. Pulando semeadura.");
        return;
    }

    console.log('Populando dados essenciais pela primeira vez...');

    if (db.createRole) {
        console.log('Seeding Roles...');
        for (const role of sampleRoles) await db.createRole(role);
        console.log(`${sampleRoles.length} roles inseridos.`);
    }

    if (db.updatePlatformSettings) {
        console.log('Seeding Platform Settings...');
        await db.updatePlatformSettings(samplePlatformSettings);
        console.log('Configurações globais inseridas.');
    }
    
    if (db.createState) {
        console.log('Seeding States...');
        for (const state of sampleStates) await db.createState(state);
        console.log(`${sampleStates.length} estados inseridos.`);
    }

    if (db.createCity) {
        console.log('Seeding Cities...');
        for (const city of sampleCities) await db.createCity(city);
        console.log(`${sampleCities.length} cidades inseridas.`);
    }

    if (db.createLotCategory) {
        console.log('Seeding Categories...');
        for (const category of sampleLotCategories) await db.createLotCategory(category);
        console.log(`${sampleLotCategories.length} categorias inseridas.`);
    }

    if (db.createSubcategory) {
        console.log('Seeding Subcategories...');
        for (const subcategory of sampleSubcategories) await db.createSubcategory(subcategory);
        console.log(`${sampleSubcategories.length} subcategorias inseridas.`);
    }
    
    if (db.createCourt && db.createJudicialDistrict && db.createJudicialBranch) {
        console.log('Seeding Judicial Entities...');
        for (const court of sampleCourts) await db.createCourt(court);
        for (const district of sampleJudicialDistricts) await db.createJudicialDistrict(district);
        for (const branch of sampleJudicialBranches) await db.createJudicialBranch(branch);
        console.log('Entidades judiciais inseridas.');
    }
    
    console.log('--- Semeadura de Dados Essenciais Finalizada ---');
}


async function initializeDatabase() {
  console.log('🚀 Iniciando script de inicialização do banco de dados...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM;

  if (activeSystem !== 'MYSQL' && activeSystem !== 'POSTGRES') {
      console.log(`🟡 DB_INIT: Pulando inicialização para o sistema: ${activeSystem}.`);
      return;
  }
  
  const dbUrl = activeSystem === 'MYSQL' ? process.env.DATABASE_URL : process.env.POSTGRES_DATABASE_URL;
  if (!dbUrl) {
      console.error(`ERRO: A variável de ambiente para ${activeSystem} não está configurada.`);
      process.exit(1);
  }

  let pool: Pool | null = null;
  try {
      if (activeSystem === 'MYSQL') {
          pool = mysql.createPool(dbUrl);
          const connection = await pool.getConnection();
          console.log(`🔌 Conexão com o banco de dados MySQL estabelecida com sucesso.`);
          connection.release();
          await executeSchema(pool);
      }
      // Adicionar lógica para PostgreSQL se necessário no futuro

      const db = getDatabaseAdapter();
      await seedEssentialData(db);

  } catch (error) {
      console.error("ERRO FATAL durante a inicialização do banco de dados:", error);
      process.exit(1);
  } finally {
      if (pool) {
          await pool.end();
          console.log("🔌 Pool de conexões do banco de dados para o script foi fechado.");
      }
      console.log("✅ Script de inicialização finalizado.");
  }
}

initializeDatabase();
