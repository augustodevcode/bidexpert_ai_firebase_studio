// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '../lib/database/get-adapter'; 
import { samplePlatformSettings, sampleRoles } from '../src/lib/sample-data';
import fs from 'fs';
import mysql, { type Pool } from 'mysql2/promise';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

async function executeSchema(pool: Pool) {
    console.log("\n--- [DB INIT - DDL] Executing MySQL Schema ---");
    const schemaPath = path.join(process.cwd(), 'schema.mysql.sql');
    if (!fs.existsSync(schemaPath)) {
        console.warn(`[DB INIT - DDL] WARNING: Schema file not found at ${schemaPath}. Skipping table creation.`);
        return;
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql.split(/;\s*$/m).filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
    
    const connection = await pool.getConnection();
    try {
        console.log("[DB INIT - DDL] Existing tables before execution:");
        const [rows] = await connection.query('SHOW TABLES;');
        console.table((rows as any[]).map(row => Object.values(row)[0]));

        for (const statement of statements) {
            const tableNameMatch = statement.match(/CREATE TABLE(?: IF NOT EXISTS)? `([^`]*)`/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown table';
            try {
                await connection.query(statement);
                console.log(`[DB INIT - DDL] ✅ SUCCESS: Table '${tableName}' processed.`);
            } catch (error: any) {
                console.error(`[DB INIT - DDL] ❌ ERROR on table '${tableName}': ${error.message}`);
                console.error(`[DB INIT - DDL] -> Failing SQL:\n\n${statement}\n`);
            }
        }
        console.log("--- [DB INIT - DDL] MySQL Schema execution finished ---");
    } catch (error) {
        console.error("[DB INIT - DDL] CRITICAL ERROR during schema execution:", error);
        throw error;
    } finally {
        connection.release();
    }
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
          await executeSchema(pool);
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
