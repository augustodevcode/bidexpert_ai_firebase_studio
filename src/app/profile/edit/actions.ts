/**
 * @fileoverview Server Action for updating a user's own profile.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
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
    // The 'as any' cast is a temporary workaround for Prisma's strictness with partial JSON types.
    // In a production scenario, you might have more robust type guards or data transformation.
    await prisma.user.update({
        where: { id: userId },
        data: {
            ...data
        } as any,
    });
    
    // Revalidate paths to ensure the updated data is reflected on the profile page
    // and any other page that might display user information.
    revalidatePath('/profile'); 
    revalidatePath(`/profile/edit`); 
    
    return { success: true, message: 'Perfil atualizado com sucesso!' };

  } catch (error: any) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return { success: false, message: `Erro ao atualizar perfil: ${error.message}` };
  }
}
