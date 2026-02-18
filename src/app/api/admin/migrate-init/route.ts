/**
 * @fileoverview TEMPORARY API route to execute initial database migration.
 * This route runs the DDL SQL to create all tables via Prisma Client (Accelerate).
 * MUST be removed after successful migration.
 * 
 * Security: Protected by a secret token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const MIGRATE_SECRET = 'bidexpert-migrate-2026-secret-key';

function createMigrationClient() {
  const url = process.env.DATABASE_URL;
  const useAccelerate = url?.startsWith('prisma+postgres://') || url?.startsWith('prisma://') || false;

  const client = new PrismaClient({
    log: ['error', 'warn'],
  });

  if (useAccelerate) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return client;
}

// Split SQL into individual statements, handling multi-line and complex SQL
function splitSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }
    
    // Check for dollar-quoted strings (PostgreSQL functions/triggers)
    if (!inDollarQuote) {
      const dollarMatch = trimmed.match(/\$([a-zA-Z_]*)\$/);
      if (dollarMatch) {
        inDollarQuote = true;
        dollarTag = dollarMatch[0];
      }
    } else if (trimmed.includes(dollarTag)) {
      inDollarQuote = false;
    }
    
    current += line + '\n';
    
    // Statement ends with semicolon and not inside dollar quote
    if (trimmed.endsWith(';') && !inDollarQuote) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') {
        statements.push(stmt);
      }
      current = '';
    }
  }
  
  // Add any remaining content
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements;
}

export async function POST(request: NextRequest) {
  try {
    // Verify secret
    const { secret, sql } = await request.json();
    
    if (secret !== MIGRATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'Missing SQL' }, { status: 400 });
    }
    
    const prisma = createMigrationClient();
    const statements = splitSQLStatements(sql);
    
    const results: { index: number; status: string; statement: string; error?: string }[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await (prisma as any).$executeRawUnsafe(stmt);
        successCount++;
        results.push({ 
          index: i, 
          status: 'ok', 
          statement: stmt.substring(0, 100) + (stmt.length > 100 ? '...' : '')
        });
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        
        // Skip "already exists" errors gracefully
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          skipCount++;
          results.push({ 
            index: i, 
            status: 'skipped', 
            statement: stmt.substring(0, 100) + '...',
            error: errorMsg.substring(0, 200)
          });
        } else {
          errorCount++;
          results.push({ 
            index: i, 
            status: 'error', 
            statement: stmt.substring(0, 100) + '...',
            error: errorMsg.substring(0, 200)
          });
        }
      }
    }
    
    await (prisma as any).$disconnect();
    
    return NextResponse.json({
      success: errorCount === 0,
      summary: {
        total: statements.length,
        success: successCount,
        skipped: skipCount,
        errors: errorCount,
      },
      results: results.filter(r => r.status !== 'ok'), // Only show non-ok for brevity
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: err?.message || String(err) 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  
  if (secret !== MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Quick health check - just try to connect and list tables
  const prisma = createMigrationClient();
  
  try {
    const tables = await (prisma as any).$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    await (prisma as any).$disconnect();
    
    return NextResponse.json({
      status: 'connected',
      tableCount: tables.length,
      tables: tables.map((t: any) => t.table_name),
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Connection failed', 
      details: err?.message || String(err) 
    }, { status: 500 });
  }
}
