
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfileData } from '@/types';

interface UpdateProfileResult {
  success: boolean;
  message: string;
}

// Type for the data expected by the update function, excluding uid and email.
export type EditableUserProfileData = Omit<UserProfileData, 'uid' | 'email' | 'status' | 'createdAt' | 'updatedAt' | 'activeBids' | 'auctionsWon' | 'itemsSold' | 'avatarUrl' | 'dataAiHint'>;

export async function updateUserProfile(
  userId: string,
  data: EditableUserProfileData
): Promise<UpdateProfileResult> {
  if (!userId) {
    return { success: false, message: 'ID do usuário não fornecido.' };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    
    // Prepare data for Firestore, ensuring dates are correctly handled if they are strings
    const dataToUpdate: Partial<UserProfileData> = { ...data };

    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      dataToUpdate.dateOfBirth = new Date(data.dateOfBirth);
    }
     if (data.rgIssueDate && typeof data.rgIssueDate === 'string') {
      dataToUpdate.rgIssueDate = new Date(data.rgIssueDate);
    }
    
    dataToUpdate.updatedAt = serverTimestamp();

    await updateDoc(userDocRef, dataToUpdate);

    revalidatePath('/profile'); // Revalidate the profile page to show updated data
    revalidatePath(`/profile/edit`); // Revalidate edit page if needed

    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    // Check for specific Firebase error codes if necessary
    return { success: false, message: error.message || 'Falha ao atualizar o perfil.' };
  }
}
