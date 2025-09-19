// src/app/admin/bens/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Bem, BemFormData } from '@/types';
import { BemService } from '@/services/bem.service';
import { getSession } from '@/app/auth/actions';
import { headers } from 'next/headers';

const bemService = new BemService();

async function getTenantIdFromRequest(isPublicCall: boolean = false): Promise<string> {
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
        return '1'; // Landlord tenant ID for public data
    }
    
    throw new Error("Acesso não autorizado ou tenant não identificado.");
}


export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    const tenantId = await getTenantIdFromRequest();
    return bemService.getBens({ ...filter, tenantId });
}

export async function getBem(id: string): Promise<Bem | null> {
    const tenantId = await getTenantIdFromRequest();
    // Bem is tenant-specific, but the service/repository handles the filtering now.
    // However, to get a single item, we might need to pass the context.
    // For now, let's assume the service call is sufficient if it uses the context-aware prisma instance.
    // If issues arise, we'd pass tenantId to the service method.
    return bemService.getBemById(id);
}

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await bemService.createBem(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
    }
    return result;
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.updateBem(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
        revalidatePath(`/admin/bens/${id}/edit`);
    }
    return result;
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.deleteBem(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
    }
    return result;
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
    return bemService.getBensByIds(ids);
}
