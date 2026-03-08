/**
 * @fileoverview Endpoint de diagnostico para exibir ambiente no rodape fixo do dashboard admin.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function normalizeUrl(url: string): string {
  if (!url) {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
}

function detectDatabaseSystem(databaseUrl: string): string {
  const url = databaseUrl.toLowerCase();

  if (url.includes('mysql://')) {
    return 'MYSQL';
  }

  if (url.includes('postgres://') || url.includes('postgresql://')) {
    return 'POSTGRESQL';
  }

  return 'UNKNOWN';
}

function detectDatabaseProvider(allUrls: string[]): string {
  const normalized = allUrls.filter(Boolean).map((url) => url.toLowerCase());

  if (normalized.some((url) => url.includes('neon.tech'))) {
    return 'Neon';
  }

  if (normalized.some((url) => url.includes('supabase.co'))) {
    return 'Supabase';
  }

  if (normalized.some((url) => url.startsWith('prisma://') || url.includes('prisma-data.net'))) {
    return 'Prisma';
  }

  if (normalized.some((url) => url.includes('postgres://') || url.includes('postgresql://'))) {
    return 'Prisma (PostgreSQL)';
  }

  if (normalized.some((url) => url.includes('mysql://'))) {
    return 'Prisma (MySQL)';
  }

  return 'Prisma';
}

function detectBranch(remoteServerUrl: string): string {
  const branchFromEnv =
    process.env.NEXT_PUBLIC_SYSTEM_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
    process.env.GIT_BRANCH ||
    process.env.NEXT_PUBLIC_GIT_BRANCH ||
    '';

  if (branchFromEnv) {
    return branchFromEnv;
  }

  if (remoteServerUrl.includes('bidexpert-demo') || remoteServerUrl.includes('demo')) {
    return 'demo-stable';
  }

  return 'main';
}

function detectRemoteServerUrl(branch: string): string {
  const remoteServerFromEnv =
    process.env.NEXT_PUBLIC_REMOTE_SERVER_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (remoteServerFromEnv) {
    return normalizeUrl(remoteServerFromEnv);
  }

  if (branch === 'main') {
    return 'https://bidexpert.vercel.app';
  }

  return 'https://bidexpert-demo.vercel.app';
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';
  const postgresUrl = process.env.POSTGRES_URL || '';
  const remoteServerPreview = detectRemoteServerUrl('demo-stable');
  const branch = detectBranch(remoteServerPreview);
  const remoteServerUrl = detectRemoteServerUrl(branch);

  return NextResponse.json({
    dbSystem: detectDatabaseSystem(databaseUrl),
    dbProvider: detectDatabaseProvider([databaseUrl, directUrl, postgresUrl]),
    project: process.env.NEXT_PUBLIC_PROJECT_NAME || process.env.VERCEL_PROJECT_ID || 'bidexpert',
    remoteServerUrl,
    branch,
  });
}
