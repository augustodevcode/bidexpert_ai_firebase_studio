/**
 * Prepares the PostgreSQL Prisma schema for Vercel builds and fills any missing
 * preview database variables from DATABASE_URL before running the normal build.
 */
import { cpSync } from 'node:fs';
import { execSync } from 'node:child_process';

if (!process.env.POSTGRES_PRISMA_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_PRISMA_URL = process.env.DATABASE_URL;
}

if (!process.env.POSTGRES_URL_NON_POOLING && process.env.POSTGRES_PRISMA_URL) {
  process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_PRISMA_URL;
}

cpSync('prisma-deploy/schema.postgresql.prisma', 'prisma/schema.prisma');
execSync('npx prisma generate', { stdio: 'inherit' });
execSync('npm run build', { stdio: 'inherit' });