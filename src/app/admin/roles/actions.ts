
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where, limit } from 'firebase/firestore';
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
  
  // Check if role name already exists (case-insensitive for creation)
  const rolesRef = collection(db, 'roles');
  const q = query(rolesRef, where('name', '==', data.name.trim().toUpperCase())); // Store/check uppercase for uniqueness
  const existingRoleSnapshot = await getDocs(q);
  if (!existingRoleSnapshot.empty) {
    return { success: false, message: `O perfil com o nome "${data.name.trim()}" já existe.` };
  }

  try {
    const newRoleData = {
      ...data,
      name: data.name.trim(), // Keep original casing for display, but could store an uppercase version for querying
      name_normalized: data.name.trim().toUpperCase(), // For case-insensitive checks
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

export async function getRoleByName(roleName: string): Promise<Role | null> {
  if (!roleName || roleName.trim() === '') {
    return null;
  }
  try {
    const rolesRef = collection(db, 'roles');
    // Query for the normalized name
    const q = query(rolesRef, where('name_normalized', '==', roleName.trim().toUpperCase()), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
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
    console.error(`[Server Action - getRoleByName] Error fetching role by name "${roleName}":`, error);
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
    const currentRoleSnap = await getDoc(roleDocRef);
    if (!currentRoleSnap.exists()) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;

    // Prevent renaming of core system roles if needed (e.g. "ADMINISTRATOR", "USER")
    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER'];
    if (systemRoles.includes(currentRoleData.name.toUpperCase()) && data.name && data.name.toUpperCase() !== currentRoleData.name.toUpperCase()) {
        // Allowing name change, but ensuring normalized name is also updated if name changes
        // return { success: false, message: `O perfil "${currentRoleData.name}" é um perfil de sistema e não pode ser renomeado.` };
    }
    
    if (data.name && data.name.toUpperCase() !== currentRoleData.name.toUpperCase()) {
      const rolesRef = collection(db, 'roles');
      const q = query(rolesRef, where('name_normalized', '==', data.name.trim().toUpperCase()), limit(1));
      const existingRoleSnapshot = await getDocs(q);
      if (!existingRoleSnapshot.empty && existingRoleSnapshot.docs[0].id !== id) {
        return { success: false, message: `Outro perfil com o nome "${data.name.trim()}" já existe.` };
      }
    }


    const updateData: Partial<Omit<Role, 'id' | 'createdAt'>> & { name_normalized?: string } = {};
    
    if (data.name) {
        updateData.name = data.name.trim();
        updateData.name_normalized = data.name.trim().toUpperCase();
    }
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
  const roleToDelete = await getRole(id);
  if (roleToDelete) {
    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER'];
    if (systemRoles.includes(roleToDelete.name.toUpperCase())) {
        return { success: false, message: `O perfil "${roleToDelete.name}" é um perfil de sistema e não pode ser excluído.` };
    }
  } else {
     return { success: false, message: `Perfil com ID ${id} não encontrado para exclusão.` };
  }

  try {
    // TODO: Add logic here to check if any users are currently assigned this role.
    // If so, either prevent deletion, reassign users to a default role, or warn the admin.
    // For now, direct deletion:
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
    const defaultRolesData: RoleFormData[] = [
        { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
        { name: 'USER', description: 'Usuário padrão com permissões de visualização e lance.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
        { name: 'CONSIGNOR', description: 'Comitente com permissão para gerenciar seus próprios leilões e lotes.', permissions: ['manage_own_auctions', 'manage_own_lots', 'view_reports'] },
        { name: 'AUCTIONEER', description: 'Leiloeiro com permissão para gerenciar leilões e conduzir pregões.', permissions: ['manage_assigned_auctions', 'conduct_auctions'] },
    ];

    let createdAny = false;
    for (const roleData of defaultRolesData) {
        const existingRole = await getRoleByName(roleData.name);
        if (!existingRole) {
            console.log(`Creating default role: ${roleData.name}`);
            await createRole(roleData);
            createdAny = true;
        } else {
            // Optionally, update permissions if they differ
            // For simplicity, we'll skip this for now, assuming default permissions don't change often.
            // console.log(`Default role "${roleData.name}" already exists.`);
        }
    }
    if (createdAny) {
        revalidatePath('/admin/roles');
    }
}

// async function where(arg0: string, arg1: string, arg2: string): Promise<any> {
//     throw new Error('Function not implemented.');
// }

// async function limit(arg0: number): Promise<any> {
//     throw new Error('Function not implemented.');
// }
