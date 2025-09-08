// This file is now obsolete as the CheckoutService in the core package
// now uses PlatformSettingsService directly. This API route can be removed.
// We are keeping it for now to avoid breaking changes, but it's no longer used
// by the refactored code.

import { NextResponse } from 'next/server';

const MICROSERVICE_URL = process.env.COMMISSION_MICROSERVICE_URL || 'http://localhost:3001';

/**
 * API Route that acts as a Backend-for-Frontend (BFF).
 * It securely forwards requests to the commission microservice.
 * @deprecated This route is no longer used by the refactored CheckoutService.
 */
export async function GET() {
  try {
    const response = await fetch(`${MICROSERVICE_URL}/api/v1/commission-rules`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[BFF] Error from microservice: ${response.status} ${errorData}`);
      return NextResponse.json({ message: 'Error fetching commission rules from microservice' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[BFF] Internal Server Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}