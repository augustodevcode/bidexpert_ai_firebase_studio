/**
 * @fileoverview Server Action for updating a user's own profile.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database/index';
import type { EditableUserProfileData } from '@/types';

interface UpdateProfileResult {
  success: boolean;
  message: string;
}

/**
 * Updates a user's profile with the provided data.
 * This action is intended to be called by the user themselves to edit their own profile.
 * @param {string} userId - The unique ID of the user whose profile is to be updated.
 * @param {EditableUserProfileData} data - An object containing the profile fields to update.
 * @returns {Promise<UpdateProfileResult>} An object indicating the result of the operation.
 */
export async function updateUserProfile(
  userId: string,
  data: EditableUserProfileData
): Promise<UpdateProfileResult> {
  if (!userId) {
    return { success: false, message: 'ID do usuário não fornecido.' };
  }
  
  try {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.updateUserProfile) {
      return { success: false, message: "Função não implementada para este adaptador." };
    }
    // @ts-ignore
    const result = await db.updateUserProfile(userId, data);
    
    if (result.success) {
      revalidatePath('/profile'); 
      revalidatePath(`/profile/edit`); 
    }
    
    return result;

  } catch (error: any) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return { success: false, message: `Erro ao atualizar perfil: ${error.message}` };
  }
}
