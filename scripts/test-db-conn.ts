/**
 * @fileoverview Script de verificação de conexão com MySQL via DATABASE_URL.
 *
 * BDD: Validar que credenciais URL-encoded conectam corretamente ao MySQL local.
 * TDD: Decodificar credenciais antes de tentar conexão no teste.
 */
import mysql from 'mysql2/promise';
import { parse } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

(async () => {
  try {
    // Parse mysql url: mysql://user:pass@host:port/db
    const matched = url.match(/^mysql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*?)$/);
    if (!matched) throw new Error('Invalid DATABASE_URL format');
    const [, user, password, host, port, database] = matched;
    const conn = await mysql.createConnection({
      host: decodeURIComponent(host),
      port: Number(port),
      user: decodeURIComponent(user),
      password: decodeURIComponent(password),
      database: decodeURIComponent(database),
    });
    const [rows] = await conn.query('SELECT VERSION() as v');
    console.log('Connected to DB - version:', rows);
    await conn.end();
  } catch (e:any) {
    console.error('DB connection failed:', e.message || e);
    process.exit(2);
  }
})();
