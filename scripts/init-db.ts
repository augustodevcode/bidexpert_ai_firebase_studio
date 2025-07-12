// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '../src/lib/database/get-adapter'; 
import { samplePlatformSettings, sampleRoles } from '../src/lib/sample-data';
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
                await connection.query(statement);
                console.log(`[DB INIT - ${scriptName}] ✅ SUCCESS: Statement executed.`);
            } catch (error: any) {
                // Ignore "Duplicate column name" and "Duplicate table" errors as they are expected if the script runs multiple times.
                if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`[DB INIT - ${scriptName}] 🟡 INFO: Table or column already exists. Skipping statement.`);
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

async function addColumnIfNotExists(pool: Pool, tableName: string, columnName: string, columnDefinition: string) {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            `SELECT COUNT(*) as count 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = ? 
               AND COLUMN_NAME = ?`,
            [tableName, columnName]
        );

        // @ts-ignore
        if (rows[0].count === 0) {
            await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
            console.log(`[DB INIT - ALTER] ✅ Coluna ${columnName} adicionada à tabela ${tableName}.`);
        } else {
            console.log(`[DB INIT - ALTER] 🟡 Coluna ${columnName} já existe na tabela ${tableName}. Ignorando.`);
        }
    } catch (error: any) {
         console.error(`[DB INIT - ALTER] ❌ Erro ao tentar adicionar coluna ${columnName} em ${tableName}: ${error.message}`);
    } finally {
        connection.release();
    }
}

async function applyAlterations(pool: Pool) {
    console.log('\n--- [DB INIT - ALTER] Applying table alterations ---');
    // Platform Settings
    await addColumnIfNotExists(pool, 'platform_settings', 'site_title', 'VARCHAR(255)');
    await addColumnIfNotExists(pool, 'platform_settings', 'site_tagline', 'VARCHAR(255)');
    await addColumnIfNotExists(pool, 'platform_settings', 'gallery_image_base_path', 'VARCHAR(255)');
    await addColumnIfNotExists(pool, 'platform_settings', 'storage_provider', 'VARCHAR(50)');
    await addColumnIfNotExists(pool, 'platform_settings', 'firebase_storage_bucket', 'VARCHAR(255)');
    await addColumnIfNotExists(pool, 'platform_settings', 'active_theme_name', 'VARCHAR(100)');
    await addColumnIfNotExists(pool, 'platform_settings', 'themes', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'platform_public_id_masks', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'homepage_sections', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'mental_trigger_settings', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'section_badge_visibility', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'map_settings', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'search_pagination_type', 'VARCHAR(50)');
    await addColumnIfNotExists(pool, 'platform_settings', 'search_items_per_page', 'INT');
    await addColumnIfNotExists(pool, 'platform_settings', 'search_load_more_count', 'INT');
    await addColumnIfNotExists(pool, 'platform_settings', 'show_countdown_on_lot_detail', 'BOOLEAN');
    await addColumnIfNotExists(pool, 'platform_settings', 'show_countdown_on_cards', 'BOOLEAN');
    await addColumnIfNotExists(pool, 'platform_settings', 'show_related_lots_on_lot_detail', 'BOOLEAN');
    await addColumnIfNotExists(pool, 'platform_settings', 'related_lots_count', 'INT');
    await addColumnIfNotExists(pool, 'platform_settings', 'default_urgency_timer_hours', 'INT');
    await addColumnIfNotExists(pool, 'platform_settings', 'variable_increment_table', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'bidding_settings', 'JSON');
    await addColumnIfNotExists(pool, 'platform_settings', 'default_list_items_per_page', 'INT');
    await addColumnIfNotExists(pool, 'platform_settings', 'updated_at', 'DATETIME');

    // Roles
    await addColumnIfNotExists(pool, 'roles', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addColumnIfNotExists(pool, 'roles', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addColumnIfNotExists(pool, 'roles', 'slug', 'VARCHAR(150)');
    
    console.log('--- [DB INIT - ALTER] Finished applying alterations ---');
}


async function seedEssentialData(db: any) {
    console.log('\n--- [DB INIT - DML] Seeding Essential Data ---');
    try {
        // Platform Settings
        console.log('[DB INIT - DML] Checking for platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            console.log("[DB INIT - DML] Inserting platform settings...");
            await db.updatePlatformSettings(samplePlatformSettings);
            console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings inserted.");
        } else {
            console.log("[DB INIT - DML] INFO: Platform settings already exist. Skipping.");
        }

        // Roles
        console.log("[DB INIT - DML] Checking for roles...");
        const roles = await db.getRoles();
        if (!roles || roles.length === 0) {
            console.log("[DB INIT - DML] Populating roles...");
            if (db.createRole) {
                for (const role of sampleRoles) {
                    await db.createRole(role);
                }
                console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleRoles.length} roles inserted.`);
            } else {
                 console.warn("[DB INIT - DML] `createRole` function not found on adapter. Skipping role seeding.");
            }
        } else {
            console.log("[DB INIT - DML] INFO: Roles already exist. Skipping.");
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
