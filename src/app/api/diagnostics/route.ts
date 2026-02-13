/**
 * @fileoverview Rota de diagnóstico para verificar status da conexão Prisma e ambiente
 * Útil para debug de deployments no Vercel
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.split('://')[0] 
        : 'NOT_SET',
      DATABASE_URL_HOST: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0]?.split(':')[0] || 'PARSE_ERROR'
        : 'NOT_SET',
      PRISMA_SCHEMA: process.env.PRISMA_SCHEMA,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    prisma: {
      status: 'pending',
      error: null as string | null,
      tableCount: null as number | null,
      sampleTables: [] as string[],
    },
  };

  // Test Prisma connection
  let prisma: PrismaClient | null = null;
  try {
    prisma = new PrismaClient({
      log: ['error'],
    });

    // Try a simple query
    const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 10
    `;

    diagnostics.prisma.status = 'connected';
    diagnostics.prisma.tableCount = result.length;
    diagnostics.prisma.sampleTables = result.map(r => r.table_name);

    // Try to count tenants
    try {
      const tenantCount = await prisma.tenant.count();
      (diagnostics.prisma as any).tenantCount = tenantCount;
    } catch (e: any) {
      (diagnostics.prisma as any).tenantError = e.message?.substring(0, 200);
    }
  } catch (error: any) {
    diagnostics.prisma.status = 'error';
    diagnostics.prisma.error = error.message?.substring(0, 500) || 'Unknown error';
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }

  return NextResponse.json(diagnostics);
}
