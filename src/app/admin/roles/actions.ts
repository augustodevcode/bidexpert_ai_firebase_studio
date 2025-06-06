
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where, limit } from 'firebase/firestore';
import type { Role, RoleFormData } from '@/types';
import { slugify } from '@/lib/sample-data';

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
  console.warn(`[roles/actions] Could not convert timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  console.log(`[createRole] Attempting to create role: ${data.name}`);
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do perfil é obrigatório.' };
  }
  
  const normalizedName = data.name.trim().toUpperCase();
  const rolesRef = collection(db, 'roles');
  const q = query(rolesRef, where('name_normalized', '==', normalizedName), limit(1));
  
  try {
    const existingRoleSnapshot = await getDocs(q);
    if (!existingRoleSnapshot.empty) {
      console.warn(`[createRole] Role with normalized name "${normalizedName}" already exists.`);
      return { success: false, message: `O perfil com o nome "${data.name.trim()}" já existe.` };
    }

    const newRoleData = {
      name: data.name.trim(),
      name_normalized: normalizedName,
      description: data.description?.trim() || '',
      permissions: data.permissions || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'roles'), newRoleData);
    console.log(`[createRole] Role "${data.name}" created successfully with ID: ${docRef.id}`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil criado com sucesso!', roleId: docRef.id };
  } catch (error: any) {
    console.error("[createRole] Error:", error);
    return { success: false, message: `Falha ao criar perfil: ${error.message}` };
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
    console.error("[getRoles] Error:", error);
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
    console.error(`[getRole] Error fetching role ${id}:`, error);
    return null;
  }
}

export async function getRoleByName(roleName: string): Promise<Role | null> {
  if (!roleName || roleName.trim() === '') {
    return null;
  }
  console.log(`[getRoleByName] Searching for role: ${roleName}`);
  try {
    const rolesRef = collection(db, 'roles');
    const q = query(rolesRef, where('name_normalized', '==', roleName.trim().toUpperCase()), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      console.log(`[getRoleByName] Role "${roleName}" found with ID: ${docSnap.id}`);
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Role;
    }
    console.warn(`[getRoleByName] Role with name "${roleName}" not found.`);
    return null;
  } catch (error: any) {
    console.error(`[getRoleByName] Error fetching role by name "${roleName}":`, error);
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
  console.log(`[updateRole] Attempting to update role ID: ${id} with data:`, data);

  try {
    const roleDocRef = doc(db, 'roles', id);
    const currentRoleSnap = await getDoc(roleDocRef);
    if (!currentRoleSnap.exists()) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;

    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER'];
    if (systemRoles.includes(currentRoleData.name.toUpperCase()) && data.name && data.name.trim().toUpperCase() !== currentRoleData.name.toUpperCase()) {
      // This check might be too restrictive depending on the rules for renaming default roles.
      // For now, allow renaming if other conditions in firestore.rules pass.
      // return { success: false, message: `O perfil "${currentRoleData.name}" é um perfil de sistema e não pode ser renomeado para um nome diferente (case-insensitive).` };
    }
    
    if (data.name && data.name.trim().toUpperCase() !== currentRoleData.name.toUpperCase()) {
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
    
    updateData.updatedAt = serverTimestamp();

    await updateDoc(roleDocRef, updateData as any); // Cast to any to satisfy Firestore update type
    console.log(`[updateRole] Role ID: ${id} updated successfully.`);
    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`[updateRole] Error updating role ID ${id}:`, error);
    return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[deleteRole] Attempting to delete role ID: ${id}`);
  const roleToDelete = await getRole(id);
  if (roleToDelete) {
    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER'];
    if (systemRoles.includes(roleToDelete.name.toUpperCase())) {
        console.warn(`[deleteRole] Attempt to delete system role "${roleToDelete.name}" blocked.`);
        return { success: false, message: `O perfil "${roleToDelete.name}" é um perfil de sistema e não pode ser excluído.` };
    }
  } else {
     console.warn(`[deleteRole] Role ID ${id} not found for deletion.`);
     return { success: false, message: `Perfil com ID ${id} não encontrado para exclusão.` };
  }

  try {
    const roleDocRef = doc(db, 'roles', id);
    await deleteDoc(roleDocRef);
    console.log(`[deleteRole] Role ID: ${id} deleted successfully.`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    console.error(`[deleteRole] Error deleting role ID ${id}:`, error);
    return { success: false, message: `Falha ao excluir perfil: ${error.message}` };
  }
}

export async function ensureDefaultRolesExist() {
    console.log("[ensureDefaultRolesExist] Verificando e criando perfis padrão se necessário...");
    const defaultRolesData: RoleFormData[] = [
        { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
        { name: 'USER', description: 'Usuário padrão com permissões de visualização e lance.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
        { name: 'CONSIGNOR', description: 'Comitente com permissão para gerenciar seus próprios leilões e lotes.', permissions: ['manage_own_auctions', 'manage_own_lots', 'view_reports'] },
        { name: 'AUCTIONEER', description: 'Leiloeiro com permissão para gerenciar leilões e conduzir pregões.', permissions: ['manage_assigned_auctions', 'conduct_auctions'] },
    ];

    let createdAny = false;
    for (const roleData of defaultRolesData) {
        console.log(`[ensureDefaultRolesExist] Verificando perfil: ${roleData.name}`);
        const existingRole = await getRoleByName(roleData.name);
        if (!existingRole) {
            console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" não encontrado. Tentando criar...`);
            const creationResult = await createRole(roleData);
            if (creationResult.success) {
                console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" criado com ID: ${creationResult.roleId}.`);
                createdAny = true;
            } else {
                 console.error(`[ensureDefaultRolesExist] Falha ao criar perfil padrão "${roleData.name}": ${creationResult.message}`);
            }
        } else {
            console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" já existe (ID: ${existingRole.id}).`);
            // Opcional: Verificar e atualizar permissões se necessário.
            // Por simplicidade, vamos assumir que as permissões dos perfis padrão não mudam frequentemente após a criação.
            // Se precisar, adicione lógica para comparar existingRole.permissions com roleData.permissions e chamar updateRole.
        }
    }
    if (createdAny) {
        revalidatePath('/admin/roles');
    }
    console.log("[ensureDefaultRolesExist] Verificação de perfis padrão concluída.");
}
