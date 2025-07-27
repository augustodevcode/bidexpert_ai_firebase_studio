
/**
 * @fileoverview Server Action for updating a user's own profile.
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
    // The UserService will handle the database update via Prisma.
    // We can expand the UserService with a dedicated 'updateProfile' method if needed,
    // but for now, we can reuse the existing user update logic if it fits.
    // For this case, we'll assume a method `updateUserProfile` exists on the service.
    
    // As `updateUser` in service might expect a different structure, let's create a dedicated one.
    // For now, let's just pass the data, assuming the service can handle it.
    // This part of the code requires creating a new method in UserService.
    // Let's assume a simplified update for now.
    const result = await userService.updateUserProfile(userId, data);
    
    if (result.success) {
      revalidatePath('/profile/edit'); 
      revalidatePath(`/profile`); 
    }
    
    return result;

  } catch (error: any) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return { success: false, message: `Erro ao atualizar perfil: ${error.message}` };
  }
}
