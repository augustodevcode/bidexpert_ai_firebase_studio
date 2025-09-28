// src/app/admin/tenants/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Tenant } from '@prisma/client';

/**
 * Fetches all tenants from the database, including the count of associated users.
 * This action should be restricted to super administrators.
 * @returns {Promise<Tenant[]>} A promise that resolves to an array of Tenant objects.
 */
export async function getTenants(): Promise<any[]> {
    // In a real app, you'd add permission checks here.
    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return tenants;
}
