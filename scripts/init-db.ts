// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '@/lib/database/get-adapter'; 
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories } from '../src/lib/sample-data';
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
        // Platform Settings (Upsert logic is safe)
        console.log('[DB INIT - DML] Checking platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            await db.createPlatformSettings(samplePlatformSettings);
        } else {
            await db.updatePlatformSettings(samplePlatformSettings);
        }
        console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings seeded.");

        // Roles
        const existingRoles = await db.getRoles();
        const existingRoleNames = new Set(existingRoles.map(r => r.name));
        const rolesToCreate = sampleRoles.filter(r => !existingRoleNames.has(r.name));
        if (rolesToCreate.length > 0) {
            console.log(`[DB INIT - DML] Inserting ${rolesToCreate.length} new roles...`);
            for (const role of rolesToCreate) {
                // @ts-ignore
                await db.createRole(role);
            }
        } else {
            console.log("[DB INIT - DML] INFO: Roles already up-to-date.");
        }
        
        // Categories
        const existingCategories = await db.getLotCategories();
        const existingCategoryIds = new Set(existingCategories.map(c => c.id));
        const categoriesToCreate = sampleLotCategories.filter(c => !existingCategoryIds.has(c.id));
        if (categoriesToCreate.length > 0) {
            console.log(`[DB INIT - DML] Inserting ${categoriesToCreate.length} new categories...`);
            for (const category of categoriesToCreate) {
                // @ts-ignore
                await db.createLotCategory(category);
            }
        } else {
            console.log("[DB INIT - DML] INFO: Categories already up-to-date.");
        }

        // Subcategories
        // @ts-ignore
        const existingSubcategories = await db.getSubcategoriesByParent ? await db.getSubcategoriesByParent(undefined) : [];
        const existingSubcategoryIds = new Set(existingSubcategories.map(s => s.id));
        const subcategoriesToCreate = sampleSubcategories.filter(s => !existingSubcategoryIds.has(s.id));

        if (subcategoriesToCreate.length > 0) {
            console.log(`[DB INIT - DML] Inserting ${subcategoriesToCreate.length} new subcategories...`);
            for (const subcategory of subcategoriesToCreate) {
                // @ts-ignore
                await db.createSubcategory(subcategory);
            }
        } else {
            console.log("[DB INIT - DML] INFO: Subcategories already up-to-date.");
        }

    } catch (error: any) {
        console.error(`[DB INIT - DML] ❌ ERROR seeding essential data: ${error.message}`);
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
          
          // Step 2: Execute ALTER TABLE script to ensure schema is up-to-date
          await executeSqlFile(pool, path.join(process.cwd(), 'src', 'alter-tables.mysql.sql'), 'DDL-ALTER');
      }
      
      // Step 3: Seed essential data now that schema is guaranteed to be correct
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
