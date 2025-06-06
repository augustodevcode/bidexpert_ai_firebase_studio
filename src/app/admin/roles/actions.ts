
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Role, RoleFormData } from '@/types';

// Helper function to safely convert Firestore Timestamp like objects or actual Timestamps to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert role timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do perfil é obrigatório.' };
  }
  if (!data.permissions || data.permissions.length === 0) {
    // return { success: false, message: 'Pelo menos uma permissão deve ser selecionada.' };
    // Permitir criar perfil sem permissões inicialmente
  }

  try {
    const newRoleData = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      permissions: data.permissions || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'roles'), newRoleData);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil criado com sucesso!', roleId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createRole] Error:", error);
    return { success: false, message: error.message || 'Falha ao criar perfil.' };
  }
}

export async function getRoles(): Promise<Role[]> {
  try {
    const rolesCollection = collection(db, 'roles');
    const q = query(rolesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Role;
    });
  } catch (error: any) {
    console.error("[Server Action - getRoles] Error:", error);
    return [];
  }
}

export async function getRole(id: string): Promise<Role | null> {
  try {
    const roleDocRef = doc(db, 'roles', id);
    const docSnap = await getDoc(roleDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Role;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getRole] Error:", error);
    return null;
  }
}

export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  if (data.name !== undefined && (data.name === null || data.name.trim() === '')) {
     return { success: false, message: 'O nome do perfil não pode ser vazio.' };
  }

  try {
    const roleDocRef = doc(db, 'roles', id);
    const updateData: Partial<Omit<Role, 'id' | 'createdAt'>> = {};
    
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.permissions) updateData.permissions = data.permissions;
    
    updateData.updatedAt = serverTimestamp() as any;

    await updateDoc(roleDocRef, updateData);
    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateRole] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar perfil.' };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  // Basic check - prevent deletion of 'ADMINISTRATOR' or 'USER' roles if they exist and have special meaning
  if (id === 'ADMINISTRATOR' || id === 'USER') {
    const roleDoc = await getRole(id);
    if (roleDoc && (roleDoc.name.toUpperCase() === 'ADMINISTRATOR' || roleDoc.name.toUpperCase() === 'USER')) {
        return { success: false, message: `O perfil "${roleDoc.name}" é um perfil padrão e não pode ser excluído.` };
    }
  }
  try {
    const roleDocRef = doc(db, 'roles', id);
    await deleteDoc(roleDocRef);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteRole] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir perfil.' };
  }
}

// Function to ensure default roles exist
export async function ensureDefaultRolesExist() {
    const defaultRoles: RoleFormData[] = [
        { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
        { name: 'USER', description: 'Usuário padrão com permissões de visualização e lance.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
        { name: 'CONSIGNOR', description: 'Comitente com permissão para gerenciar seus próprios leilões e lotes.', permissions: ['manage_own_auctions', 'manage_own_lots', 'view_reports'] },
        { name: 'AUCTIONEER', description: 'Leiloeiro com permissão para gerenciar leilões e conduzir pregões.', permissions: ['manage_assigned_auctions', 'conduct_auctions'] },
    ];

    for (const roleData of defaultRoles) {
        const rolesRef = collection(db, 'roles');
        const q = query(rolesRef, where('name', '==', roleData.name), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`Creating default role: ${roleData.name}`);
            await createRole(roleData);
        } else {
            // console.log(`Default role "${roleData.name}" already exists.`);
        }
    }
}

async function where(arg0: string, arg1: string, arg2: string): Promise<any> {
    throw new Error('Function not implemented.');
}

async function limit(arg0: number): Promise<any> {
    throw new Error('Function not implemented.');
}

    