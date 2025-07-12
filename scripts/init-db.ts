
// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '../src/lib/database/get-adapter'; 
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
                // Ignore "Duplicate column name" and "Table already exists" errors
                 if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`[DB INIT - ${scriptName}] 🟡 INFO: Item já existe. Pulando statement.`);
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

async function applyAlterations(pool: Pool) {
    console.log('\n--- [DB INIT - ALTER] Applying table alterations ---');
    await executeSqlFile(pool, path.join(process.cwd(), 'src', 'alter-tables.mysql.sql'), 'DDL-ALTER');
    console.log('--- [DB INIT - ALTER] Finished applying alterations ---');
}

async function seedEssentialData(db: any) {
    console.log('\n--- [DB INIT - DML] Seeding Essential Data ---');
    try {
        // Platform Settings
        console.log('[DB INIT - DML] Checking for platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            console.log("[DB INIT - DML] No settings found. Inserting new ones...");
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings inserted.");
        } else {
            console.log("[DB INIT - DML] Platform settings found. Ensuring they are up-to-date...");
            await db.updatePlatformSettings(samplePlatformSettings);
            console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings updated/verified.");
        }

        // Roles
        console.log("[DB INIT - DML] Checking for roles...");
        const roles = await db.getRoles();
        if (!roles || roles.length === 0) {
            console.log("[DB INIT - DML] Populating roles...");
            for (const role of sampleRoles) {
                await db.createRole(role);
            }
            console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleRoles.length} roles inserted.`);
        } else {
            console.log("[DB INIT - DML] INFO: Roles already exist. Skipping.");
        }
        
        // Categories & Subcategories
        console.log("[DB INIT - DML] Checking for categories...");
        const categories = await db.getLotCategories();
        if (!categories || categories.length === 0) {
            console.log("[DB INIT - DML] Populating categories...");
            for (const category of sampleLotCategories) {
                await db.createLotCategory(category);
            }
            console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleLotCategories.length} categories inserted.`);

            console.log("[DB INIT - DML] Populating subcategories...");
            for (const subcategory of sampleSubcategories) {
                await db.createSubcategory(subcategory);
            }
            console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleSubcategories.length} subcategories inserted.`);
        } else {
            console.log("[DB INIT - DML] INFO: Categories already exist. Skipping.");
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

          // Execute DDL (table creation)
          await executeSqlFile(pool, path.join(process.cwd(), 'src', 'schema.mysql.sql'), 'DDL-CREATE');
          // Execute ALTER TABLE script programmatically
          await applyAlterations(pool);
      }
      
      const db = getDatabaseAdapter();
      await seedEssentialData(db);

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
