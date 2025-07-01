
// src/app/api/set-config/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const databaseSystem = body.database;

    if (!['SAMPLE_DATA', 'FIRESTORE', 'MYSQL', 'POSTGRES'].includes(databaseSystem)) {
      return NextResponse.json({ success: false, message: 'Invalid database system specified.' }, { status: 400 });
    }

    // Set the cookie that will be read by server components/actions
    cookies().set('dev-config-db', databaseSystem, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true, // For security, not readable by client-side JS
      sameSite: 'lax',
    });

    console.log(`[API set-config] Set 'dev-config-db' cookie to: ${databaseSystem}`);
    
    return NextResponse.json({ success: true, message: `Configuration set to ${databaseSystem}` });

  } catch (error: any) {
    console.error('[API set-config] Error:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
