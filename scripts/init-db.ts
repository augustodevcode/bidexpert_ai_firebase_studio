
// scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { sampleRoles, samplePlatformSettings } from '../src/lib/sample-data';
import { slugify } from '../src/lib/sample-data-helpers';

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase();

async function initializeMySql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL (para MySQL) não está definida no arquivo .env.');
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection(connectionString);
    console.log('Conectado ao banco de dados MySQL.');

    // Verificar e popular a tabela de perfis (roles)
    const [roles] = await connection.execute('SELECT COUNT(*) as count FROM `roles`');
    if (Array.isArray(roles) && roles[0] && (roles[0] as any).count === 0) {
      console.log('Tabela `roles` vazia. Populando com dados padrão...');
      for (const role of sampleRoles) {
        const sql = 'INSERT INTO `roles` (id, name, name_normalized, description, permissions) VALUES (?, ?, ?, ?, ?)';
        await connection.execute(sql, [role.id, role.name, role.name_normalized, role.description, JSON.stringify(role.permissions)]);
      }
      console.log(`${sampleRoles.length} perfis inseridos.`);
    } else {
      console.log('Tabela `roles` já contém dados.');
    }

    // Verificar e popular a tabela de configurações da plataforma
    const [settings] = await connection.execute('SELECT COUNT(*) as count FROM `platform_settings` WHERE id = ?', ['global']);
     if (Array.isArray(settings) && settings[0] && (settings[0] as any).count === 0) {
      console.log('Configurações globais não encontradas. Inserindo dados padrão...');
      const settingsSql = 'INSERT INTO `platform_settings` (id, settings_data) VALUES (?, ?)';
      await connection.execute(settingsSql, ['global', JSON.stringify(samplePlatformSettings)]);
      console.log('Configurações globais inseridas.');
    } else {
      console.log('Configurações globais já existem.');
    }

  } catch (error) {
    console.error('Erro durante a inicialização do banco de dados MySQL:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

async function initializePostgres() {
  const connectionString = process.env.POSTGRES_DATABASE_URL;
  if (!connectionString) {
    console.error('POSTGRES_DATABASE_URL não está definida no arquivo .env.');
    process.exit(1);
  }
  
  const pool = new PgPool({ connectionString });
  const client = await pool.connect();
  try {
    console.log('Conectado ao banco de dados PostgreSQL.');
    await client.query('BEGIN');

    // Verificar e popular a tabela de perfis (roles)
    const resRoles = await client.query('SELECT COUNT(*) as count FROM "Role"');
    if (resRoles.rows[0].count === '0') {
      console.log('Tabela "Role" vazia. Populando com dados padrão...');
      for (const role of sampleRoles) {
        const sql = 'INSERT INTO "Role" (id, name, name_normalized, description, permissions) VALUES ($1, $2, $3, $4, $5)';
        await client.query(sql, [role.id, role.name, role.name_normalized, role.description, JSON.stringify(role.permissions)]);
      }
      console.log(`${sampleRoles.length} perfis inseridos.`);
    } else {
      console.log('Tabela "Role" já contém dados.');
    }

    // Verificar e popular a tabela de configurações da plataforma
    const resSettings = await client.query('SELECT COUNT(*) as count FROM "PlatformSettings" WHERE id = $1', ['global']);
    if (resSettings.rows[0].count === '0') {
      console.log('Configurações globais não encontradas. Inserindo dados padrão...');
      const settingsSql = 'INSERT INTO "PlatformSettings" (id, "settingsData") VALUES ($1, $2)';
      await client.query(settingsSql, ['global', JSON.stringify(samplePlatformSettings)]);
      console.log('Configurações globais inseridas.');
    } else {
      console.log('Configurações globais já existem.');
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro durante a inicialização do banco de dados PostgreSQL:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  console.log(`Sistema de banco de dados ativo: ${activeSystem}`);
  if (activeSystem === 'MYSQL') {
    await initializeMySql();
  } else if (activeSystem === 'POSTGRES') {
    await initializePostgres();
  } else {
    console.log('Script de inicialização não é necessário para SAMPLE_DATA ou FIRESTORE.');
    process.exit(0);
  }
  console.log('Inicialização do banco de dados concluída com sucesso.');
}

main();
