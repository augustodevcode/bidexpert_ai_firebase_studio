
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
  if (!userId) {
    return { success: false, message: 'ID do usuário não fornecido.' };
  }
  const db = getDatabaseAdapter();
  const result = await db.updateUserProfile(userId, data);

  if (result.success) {
    revalidatePath('/profile'); 
    revalidatePath(`/profile/edit`); 
  }
  return result;
}
