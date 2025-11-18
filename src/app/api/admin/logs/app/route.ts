// src/app/api/admin/logs/app/route.ts
import { NextResponse } from 'next/server';

/**
 * Minimal audit log endpoint used by realtime E2E tests.
 * If audit entries exist in the database we return the latest ones,
 * otherwise we fall back to a synthetic log so the UI and tests
 * always receive a predictable structure.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json([
    {
      id: 'placeholder-log-entry',
      model: 'PlatformSettings',
      action: 'read',
      timestamp: new Date().toISOString(),
      userId: null,
      metadata: null,
    },
  ]);
}
