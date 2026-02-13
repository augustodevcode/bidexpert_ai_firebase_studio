// src/app/profile/edit/actions.ts
/**
 * @fileoverview Server Action para a página de edição de perfil do usuário.
 * Contém a lógica para que um usuário autenticado atualize suas próprias
 * informações de perfil. Esta ação encapsula a chamada ao `UserService`,
 * garantindo que a edição seja aplicada ao usuário correto e que o cache
 * seja revalidado após a alteração.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { EditableUserProfileData } from '@/types';
import { UserService } from '@/services/user.service';

interface UpdateProfileResult {
  success: boolean;
  message: string;
}

const userService = new UserService();

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
    const result = await userService.updateUserProfile(userId, data);
    
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/profile/edit'); 
      revalidatePath('/dashboard/profile/edit');
      revalidatePath(`/profile`); 
    }
    
    return result;

  } catch (error: any) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return { success: false, message: `Erro ao atualizar perfil: ${error.message}` };
  }
}
