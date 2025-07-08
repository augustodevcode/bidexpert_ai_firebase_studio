
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { EditableUserProfileData } from '@/types';

interface UpdateProfileResult {
  success: boolean;
  message: string;
}

export async function updateUserProfile(
  userId: string,
  data: EditableUserProfileData
): Promise<UpdateProfileResult> {
  if (!userId) {
    return { success: false, message: 'ID do usuário não fornecido.' };
  }
  
  try {
    await prisma.user.update({
        where: { id: userId },
        data: {
            ...data
        } as any,
    });
    
    revalidatePath('/profile'); 
    revalidatePath(`/profile/edit`); 
    
    return { success: true, message: 'Perfil atualizado com sucesso!' };

  } catch (error: any) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return { success: false, message: `Erro ao atualizar perfil: ${error.message}` };
  }
}
