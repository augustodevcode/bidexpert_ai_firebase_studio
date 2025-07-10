// src/app/admin/users/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { UserProfileData, Role } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
    const db = await getDatabaseAdapter();
    return db.getUsersWithRoles();
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
    const db = await getDatabaseAdapter();
    return db.getUserProfileData(userId);
}

export async function updateUserRole(userId: string, roleId: string | null): Promise<{success: boolean; message: string}> {
    const db = await getDatabaseAdapter();
    const result = await db.updateUserRole(userId, roleId);
    if(result.success) {
        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${userId}/edit`);
    }
    return result;
}

export async function getRoles(): Promise<Role[]> {
    const db = await getDatabaseAdapter();
    return db.getRoles();
}
