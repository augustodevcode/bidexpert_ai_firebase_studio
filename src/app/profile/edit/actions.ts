
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Usa a instância do cliente para este exemplo
import type { UserProfileData, EditableUserProfileData } from '@/types';
import { FieldValue } from '@/lib/firebase/admin'; // Importar do admin para serverTimestamp


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
    const userDocRef = doc(db, 'users', userId);
    
    // Prepara os dados para o Firestore. 
    // O `FieldValue.serverTimestamp()` precisa ser do SDK Admin, mas esta action
    // como está, usaria o client SDK se não ajustarmos.
    // Vamos assumir que as Server Actions que fazem escrita devem usar o Admin SDK.
    // Para isso, o `db` importado aqui deveria ser o `dbAdmin`.
    // Por enquanto, vou manter o `db` do cliente, e o `updatedAt` não será um serverTimestamp
    // a menos que `ensureAdminInitialized` seja chamado e `dbAdmin` usado.
    // A correção mais profunda é usar dbAdmin aqui.
    
    const dataToUpdate: Partial<UserProfileData> = { ...data };

    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      dataToUpdate.dateOfBirth = new Date(data.dateOfBirth);
    } else if (data.dateOfBirth instanceof Date) {
      dataToUpdate.dateOfBirth = data.dateOfBirth; // Already a Date
    } else {
      dataToUpdate.dateOfBirth = null; // Explicitly null if undefined or not a valid date string/object
    }

     if (data.rgIssueDate && typeof data.rgIssueDate === 'string') {
      dataToUpdate.rgIssueDate = new Date(data.rgIssueDate);
    } else if (data.rgIssueDate instanceof Date) {
        dataToUpdate.rgIssueDate = data.rgIssueDate;
    } else {
      dataToUpdate.rgIssueDate = null;
    }
    
    // Para usar FieldValue.serverTimestamp(), precisaríamos do dbAdmin.
    // Como alternativa, podemos usar new Date() aqui se for aceitável
    // que o timestamp seja gerado no cliente (ou neste contexto de server action, pelo servidor mas como um Date).
    (dataToUpdate as any).updatedAt = new Date(); // Usando Date do cliente por enquanto. Para serverTimestamp, precisaria do dbAdmin.

    await updateDoc(userDocRef, dataToUpdate);

    revalidatePath('/profile'); 
    revalidatePath(`/profile/edit`); 

    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: error.message || 'Falha ao atualizar o perfil.' };
  }
}

