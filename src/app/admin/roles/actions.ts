
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
  console.log(`[createRole] Tentando criar perfil: ${data.name} com permissões:`, data.permissions);
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do perfil é obrigatório.' };
  }
  
  const normalizedName = data.name.trim().toUpperCase();
  const rolesRef = collection(db, 'roles');
  const q = query(rolesRef, where('name_normalized', '==', normalizedName), limit(1));
  
  try {
    const existingRoleSnapshot = await getDocs(q);
    if (!existingRoleSnapshot.empty) {
      console.warn(`[createRole] Perfil com nome normalizado "${normalizedName}" já existe.`);
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
    console.log(`[createRole] Perfil "${data.name}" criado com sucesso! ID: ${docRef.id}`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil criado com sucesso!', roleId: docRef.id };
  } catch (error: any) {
    console.error(`[createRole] ERRO ao criar perfil "${data.name}":`, error.message, error.code);
    return { success: false, message: `Falha ao criar perfil: ${error.message}` };
  }
}

export async function getRoles(): Promise<Role[]> {
  try {
    const rolesCollection = collection(db, 'roles');
    const q = query(rolesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const rolesList = snapshot.docs.map(docSnap => {
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
    console.log(`[getRoles] ${rolesList.length} perfis encontrados.`);
    return rolesList;
  } catch (error: any) {
    console.error("[getRoles] ERRO ao buscar perfis:", error.message, error.code);
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
    console.error(`[getRole] ERRO ao buscar perfil ${id}:`, error.message, error.code);
    return null;
  }
}

export async function getRoleByName(roleName: string): Promise<Role | null> {
  if (!roleName || roleName.trim() === '') {
    return null;
  }
  const normalizedQueryName = roleName.trim().toUpperCase();
  console.log(`[getRoleByName] Buscando perfil com name_normalized: "${normalizedQueryName}"`);
  try {
    const rolesRef = collection(db, 'roles');
    const q = query(rolesRef, where('name_normalized', '==', normalizedQueryName), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      console.log(`[getRoleByName] Perfil "${normalizedQueryName}" ENCONTRADO. ID: ${docSnap.id}`);
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Role;
    }
    console.warn(`[getRoleByName] Perfil com name_normalized "${normalizedQueryName}" NÃO encontrado.`);
    return null;
  } catch (error: any) {
    console.error(`[getRoleByName] ERRO ao buscar perfil "${normalizedQueryName}":`, error.message, error.code);
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
  console.log(`[updateRole] Tentando atualizar perfil ID: ${id} com dados:`, data);

  try {
    const roleDocRef = doc(db, 'roles', id);
    const currentRoleSnap = await getDoc(roleDocRef);
    if (!currentRoleSnap.exists()) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;

    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    if (systemRoles.includes(currentRoleData.name.toUpperCase()) && data.name && data.name.trim().toUpperCase() !== currentRoleData.name.toUpperCase()) {
       console.warn(`[updateRole] Tentativa de renomear perfil de sistema "${currentRoleData.name}" para "${data.name}".`);
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

    await updateDoc(roleDocRef, updateData as any); 
    console.log(`[updateRole] Perfil ID: ${id} atualizado com sucesso.`);
    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`[updateRole] ERRO ao atualizar perfil ID ${id}:`, error.message, error.code);
    return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[deleteRole] Tentando excluir perfil ID: ${id}`);
  const roleToDelete = await getRole(id);
  if (roleToDelete) {
    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    if (systemRoles.includes(roleToDelete.name.toUpperCase())) {
        console.warn(`[deleteRole] Tentativa de excluir perfil de sistema "${roleToDelete.name}" bloqueada.`);
        return { success: false, message: `O perfil "${roleToDelete.name}" é um perfil de sistema e não pode ser excluído.` };
    }
  } else {
     console.warn(`[deleteRole] Perfil ID ${id} não encontrado para exclusão.`);
     return { success: false, message: `Perfil com ID ${id} não encontrado para exclusão.` };
  }

  try {
    const roleDocRef = doc(db, 'roles', id);
    await deleteDoc(roleDocRef);
    console.log(`[deleteRole] Perfil ID: ${id} excluído com sucesso.`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    console.error(`[deleteRole] ERRO ao excluir perfil ID ${id}:`, error.message, error.code);
    return { success: false, message: `Falha ao excluir perfil: ${error.message}` };
  }
}

export async function ensureDefaultRolesExist() {
    console.log("[ensureDefaultRolesExist] Verificando e criando perfis padrão se necessário...");
    const defaultRolesData: RoleFormData[] = [
        { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
        { name: 'USER', description: 'Usuário padrão com permissões de visualização e lance (após habilitação).', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
        { name: 'CONSIGNOR', description: 'Comitente com permissão para gerenciar seus próprios leilões e lotes.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload', 'media:read'] },
        { name: 'AUCTIONEER', description: 'Leiloeiro com permissão para gerenciar leilões e conduzir pregões.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions', 'media:upload', 'media:read'] },
        {
          name: 'AUCTION_ANALYST',
          description: 'Analista de Leilões com permissões para gerenciar cadastros e habilitação de usuários.',
          permissions: [
            'categories:create', 'categories:read', 'categories:update', 'categories:delete',
            'states:create', 'states:read', 'states:update', 'states:delete',
            'cities:create', 'cities:read', 'cities:update', 'cities:delete',
            'auctioneers:read', 'auctioneers:update', 
            'sellers:read', 'sellers:update', 
            'auctions:read', 'auctions:update',
            'lots:read', 'lots:update',
            'users:read', 'users:manage_habilitation', 
            'media:read',
            'view_reports'
          ]
        }
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
            console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" já existe (ID: ${existingRole.id}). Verificando permissões...`);
            const currentPermissions = existingRole.permissions || [];
            const expectedPermissions = roleData.permissions || [];
            const permissionsMatch = expectedPermissions.length === currentPermissions.length && expectedPermissions.every(p => currentPermissions.includes(p));
            if (!permissionsMatch || existingRole.description !== (roleData.description || '')) {
                 console.log(`[ensureDefaultRolesExist] Atualizando permissões/descrição para o perfil "${roleData.name}".`);
                 await updateRole(existingRole.id, { 
                     name: existingRole.name, // Manter o nome original para não re-slugificar desnecessariamente se o case mudou
                     description: roleData.description, 
                     permissions: roleData.permissions 
                 });
            }
        }
    }
    if (createdAny) {
        revalidatePath('/admin/roles');
    }
    console.log("[ensureDefaultRolesExist] Verificação de perfis padrão concluída.");
}


    