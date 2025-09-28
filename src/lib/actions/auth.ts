// src/lib/actions/auth.ts
'use server';

import { getSession } from '@/app/auth/actions';
import { headers } from 'next/headers';
import { tenantContext } from '@/lib/prisma';

export async function getTenantIdFromRequest(isPublicCall = false): Promise<string> {
    const session = await getSession();
    if (session?.tenantId) {
        return session.tenantId;
    }

    const headersList = headers();
    const tenantIdFromHeader = headersList.get('x-tenant-id');
    
    if (tenantIdFromHeader) {
        return tenantIdFromHeader;
    }

    if (isPublicCall) {
        return '1'; // Public calls default to the landlord tenant
    }
    
    // As a final fallback for internal server calls where no context is set, default to landlord.
    // This is a safety measure. Services should ideally be called within a context.
    console.warn("[getTenantIdFromRequest] Warning: Tenant ID not found in session or headers. Defaulting to Landlord ('1'). This may not be intended for all operations.");
    return '1';
}
