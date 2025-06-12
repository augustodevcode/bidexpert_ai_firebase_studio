
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { EditableUserProfileData } from '@/types';

interface UpdateProfileResult {
  success: boolean;
  message: string;
}

export async function updateUserProfile(
  userId: string,
  data: EditableUserProfileData
): Promise<UpdateProfileResult> {
  console.log(`[updateUserProfile Action ENTER] Called for userId: ${userId}`);
  if (!userId) {
    return { success: false, message: 'ID do usuário não fornecido.' };
  }
  
  const db = await getDatabaseAdapter(); // Adicionado await
  console.log(`[updateUserProfile Action] DB Adapter Type: ${db?.constructor?.name}`);
  console.log(`[updateUserProfile Action] typeof db.updateUserProfile: ${typeof (db as any)?.updateUserProfile}`);


  if (!db || typeof db.updateUserProfile !== 'function') {
    const errorMessage = `[updateUserProfile Action] CRITICAL: db.updateUserProfile is not a function. Adapter type: ${db?.constructor?.name}.`;
    console.error(errorMessage);
    console.error(`[updateUserProfile Action] DB Object keys: ${db ? Object.keys(db).join(', ') : 'N/A'}`);
    console.error(`[updateUserProfile Action] DB Object prototype keys: ${db ? Object.keys(Object.getPrototypeOf(db) || {}).join(', ') : 'N/A'}`);
    return { success: false, message: `Erro interno do servidor: Método de atualização de perfil indisponível. Adapter: ${db?.constructor?.name}` };
  }
  console.log(`[updateUserProfile Action] db.updateUserProfile IS a function. Calling it...`);
  const result = await db.updateUserProfile(userId, data);

  if (result.success) {
    revalidatePath('/profile'); 
    revalidatePath(`/profile/edit`); 
  }
  console.log(`[updateUserProfile Action EXIT] Result:`, result);
  return result;
}
