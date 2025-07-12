// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '@/lib/database/get-adapter'; 
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories } from '@/lib/sample-data';
import fs from 'fs';
import mysql, { type Pool } from 'mysql2/promise';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

async function executeSqlFile(pool: Pool, filePath: string, scriptName: string) {
    console.log(`\n--- [DB INIT - ${scriptName}] Executing MySQL Script: ${path.basename(filePath)} ---`);
    if (!fs.existsSync(filePath)) {
        console.warn(`[DB INIT - ${scriptName}] WARNING: Script file not found at ${filePath}. Skipping.`);
        return;
    }
    const sqlScript = fs.readFileSync(filePath, 'utf8');
    const statements = sqlScript.split(/;\s*$/m).filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
    
    const connection = await pool.getConnection();
    try {
        for (const statement of statements) {
            try {
                // Specific handling for CREATE TABLE to be idempotent
                if (statement.trim().toUpperCase().startsWith('CREATE TABLE')) {
                    const tableNameMatch = statement.match(/CREATE TABLE `([^`]+)`/);
                    if (tableNameMatch) {
                        const tableName = tableNameMatch[1];
                        const [rows] = await connection.query(`SHOW TABLES LIKE ?`, [tableName]);
                        // @ts-ignore
                        if (rows.length > 0) {
                            console.log(`[DB INIT - ${scriptName}] 🟡 INFO: Tabela '${tableName}' já existe. Pulando criação.`);
                            continue;
                        }
                    }
                }
                await connection.query(statement);
                console.log(`[DB INIT - ${scriptName}] ✅ SUCCESS: Statement executado.`);
            } catch (error: any) {
                // Ignore "Duplicate column name", "Table already exists", "Duplicate entry" and other safe errors
                 if (['ER_DUP_FIELDNAME', 'ER_TABLE_EXISTS_ERROR', 'ER_DUP_ENTRY'].includes(error.code)) {
                    console.log(`[DB INIT - ${scriptName}] 🟡 INFO: Item já existe (${error.code}). Pulando statement.`);
                } else {
                     console.error(`[DB INIT - ${scriptName}] ❌ ERROR: ${error.message}`);
                     console.error(`[DB INIT - ${scriptName}] -> Failing SQL:\n\n${statement}\n`);
                }
            }
        }
        console.log(`--- [DB INIT - ${scriptName}] Script execution finished ---`);
    } catch (error) {
        console.error(`[DB INIT - ${scriptName}] CRITICAL ERROR during script execution:`, error);
        throw error;
    } finally {
        connection.release();
    }
}


async function seedEssentialData() {
    console.log('\n--- [DB INIT - DML] Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    try {
        // Platform Settings
        console.log('[DB INIT - DML] Seeding platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT - DML] 🟡 INFO: Platform settings already exist.");
        }

        // Roles
        console.log("[DB INIT - DML] Seeding roles...");
        const existingRoles = await db.getRoles();
        const rolesToCreate = sampleRoles.filter(role => !existingRoles.some(er => er.name_normalized === role.name_normalized));
        if (rolesToCreate.length > 0) {
            for (const role of rolesToCreate) {
                await db.createRole(role);
            }
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${rolesToCreate.length} new roles inserted.`);

        // Categories
        console.log("[DB INIT - DML] Seeding categories...");
        const existingCategories = await db.getLotCategories();
        const categoriesToCreate = sampleLotCategories.filter(cat => !existingCategories.some(ec => ec.slug === cat.slug));
        if (categoriesToCreate.length > 0) {
            for (const category of categoriesToCreate) {
                await db.createLotCategory(category);
            }
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${categoriesToCreate.length} new categories inserted.`);
        
        // Subcategories
        console.log("[DB INIT - DML] Seeding subcategories...");
        const allSubcategories = await db.getSubcategoriesByParent();
        const subcategoriesToCreate = sampleSubcategories.filter(sub => !allSubcategories.some(es => es.slug === sub.slug && es.parentCategoryId === sub.parentCategoryId));

        if (subcategoriesToCreate.length > 0) {
            for (const subcategory of subcategoriesToCreate) {
                await db.createSubcategory(subcategory);
            }
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${subcategoriesToCreate.length} new subcategories inserted.`);


    } catch (error: any) {
        console.error(`[DB INIT - DML] ❌ ERROR seeding essential data: ${error.message}`);
        throw error;
    }
    
    console.log('--- [DB INIT - DML] Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM;
  console.log(`[DB INIT] Active database system: ${activeSystem}`);

  if (activeSystem !== 'MYSQL' && activeSystem !== 'POSTGRES') {
      console.log(`[DB INIT] 🟡 Skipping initialization for system: ${activeSystem}.`);
      return;
  }
  
  const dbUrl = activeSystem === 'MYSQL' ? process.env.DATABASE_URL : process.env.POSTGRES_DATABASE_URL;
  if (!dbUrl) {
      console.error(`[DB INIT] ❌ ERROR: Database URL for ${activeSystem} is not configured.`);
      process.exit(1);
  }

  let pool: Pool | null = null;
  try {
      if (activeSystem === 'MYSQL') {
          pool = mysql.createPool(dbUrl);
          const connection = await pool.getConnection();
          console.log(`[DB INIT] 🔌 MySQL database connection established successfully.`);
          connection.release();

          // Step 1: Execute DDL (table creation)
          await executeSqlFile(pool, path.join(process.cwd(), 'src', 'schema.mysql.sql'), 'DDL-CREATE');
          
      }
      
      // Step 2: Seed essential data now that schema is guaranteed to be correct
      await seedEssentialData();

  } catch (error) {
      console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
      process.exit(1);
  } finally {
      if (pool) {
          await pool.end();
          console.log("[DB INIT] 🔌 Database connection pool for script closed.");
      }
      console.log("✅ [DB INIT] Initialization script finished.");
  }
}

initializeDatabase();
