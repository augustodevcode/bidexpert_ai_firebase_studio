
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where, limit } from 'firebase/firestore';
import type { Role, RoleFormData } from '@/types';
import { slugify } from '@/lib/sample-data';
import { predefinedPermissions } from './role-form-schema';


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

    const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));

    const newRoleData = {
      name: data.name.trim(),
      name_normalized: normalizedName,
      description: data.description?.trim() || '',
      permissions: validPermissions,
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
        name_normalized: data.name_normalized, // Added name_normalized
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
    console.warn(`[getRoleByName] Tentativa de buscar perfil com nome vazio ou nulo.`);
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
        name_normalized: data.name_normalized, // Added name_normalized
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
  data: Partial<RoleFormData> // data can be { description?, permissions? } or { name, description?, permissions? }
): Promise<{ success: boolean; message: string }> {
  console.log(`[updateRole] Tentando atualizar perfil ID: ${id} com dados:`, JSON.stringify(data));

  try {
    const roleDocRef = doc(db, 'roles', id);
    const currentRoleSnap = await getDoc(roleDocRef);
    if (!currentRoleSnap.exists()) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;
    
    // Determine if it's a system role based on the current name_normalized
    const systemRoleNamesUpper = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const isSystemRole = systemRoleNamesUpper.includes(currentRoleData.name_normalized?.toUpperCase() || '');

    const updatePayload: Partial<Omit<Role, 'id' | 'createdAt'>> = {};
    let hasChanges = false;

    if (data.name !== undefined && data.name.trim() !== currentRoleData.name) {
      if (isSystemRole) {
        console.warn(`[updateRole] Tentativa de renomear perfil de sistema "${currentRoleData.name}" para "${data.name.trim()}" bloqueada. Apenas descrição e permissões podem ser alteradas para perfis de sistema por esta action.`);
        // Allow updating description and permissions even if name change is blocked for system roles
      } else {
        if (!data.name || data.name.trim() === '') {
            return { success: false, message: 'O nome do perfil não pode ser vazio.' };
        }
        const newNormalizedName = data.name.trim().toUpperCase();
        const rolesRef = collection(db, 'roles');
        const q = query(rolesRef, where('name_normalized', '==', newNormalizedName), limit(1));
        const existingRoleSnapshot = await getDocs(q);
        if (!existingRoleSnapshot.empty && existingRoleSnapshot.docs[0].id !== id) {
          return { success: false, message: `Outro perfil com o nome "${data.name.trim()}" já existe.` };
        }
        updatePayload.name = data.name.trim();
        updatePayload.name_normalized = newNormalizedName;
        hasChanges = true;
      }
    }

    if (data.description !== undefined && data.description.trim() !== (currentRoleData.description || '')) {
        updatePayload.description = data.description.trim();
        hasChanges = true;
    }
    if (data.permissions) {
      const currentPermissions = currentRoleData.permissions || [];
      const newPermissions = data.permissions.filter(p => predefinedPermissions.some(pp => pp.id === p));
      const permissionsAreSame = newPermissions.length === currentPermissions.length && newPermissions.every(p => currentPermissions.includes(p));
      if (!permissionsAreSame) {
        updatePayload.permissions = newPermissions;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
        updatePayload.updatedAt = serverTimestamp() as Timestamp;
        await updateDoc(roleDocRef, updatePayload); 
        console.log(`[updateRole] Perfil ID: ${id} atualizado com sucesso com campos:`, Object.keys(updatePayload));
    } else {
        console.log(`[updateRole] Perfil ID: ${id} não necessitou de atualização (sem alterações nos dados fornecidos).`);
    }

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
    const roleNameToCheck = roleToDelete.name_normalized || roleToDelete.name.toUpperCase();
    if (systemRoles.includes(roleNameToCheck)) {
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

export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string }> {
    console.log("[ensureDefaultRolesExist] Verificando e criando/sincronizando perfis padrão se necessário...");
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

    let createdOrUpdatedAny = false;
    let allSuccessful = true;
    let overallMessage = 'Perfis padrão verificados.';

    try {
        for (const roleData of defaultRolesData) {
            console.log(`[ensureDefaultRolesExist] Verificando perfil: ${roleData.name}`);
            const existingRole = await getRoleByName(roleData.name); // getRoleByName now uses name_normalized
            if (!existingRole) {
                console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" não encontrado. Tentando criar...`);
                const creationResult = await createRole(roleData);
                if (creationResult.success) {
                    console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" criado com ID: ${creationResult.roleId}.`);
                    createdOrUpdatedAny = true;
                } else {
                    console.error(`[ensureDefaultRolesExist] Falha ao criar perfil padrão "${roleData.name}": ${creationResult.message}`);
                    allSuccessful = false;
                    overallMessage = `Falha ao criar o perfil "${roleData.name}".`;
                    break; 
                }
            } else {
                console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" (ID: ${existingRole.id}) já existe. Verificando descrição e permissões...`);
                const currentPermissions = existingRole.permissions || [];
                const expectedPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
                
                const permissionsAreSame = expectedPermissions.length === currentPermissions.length && expectedPermissions.every(p => currentPermissions.includes(p));
                const descriptionIsSame = (existingRole.description || '') === (roleData.description || '');

                const syncPayload: Partial<RoleFormData> = {};
                let needsSync = false;

                if (!descriptionIsSame) {
                    syncPayload.description = roleData.description;
                    needsSync = true;
                }
                if (!permissionsAreSame) {
                    syncPayload.permissions = expectedPermissions;
                    needsSync = true;
                }
                // Name and name_normalized are not part of syncPayload for default roles,
                // as updateRole handles name changes differently for system roles.
                // If the display name in defaultRolesData differs from existingRole.name,
                // updateRole will handle updating just 'name' for system roles.

                if (needsSync || roleData.name !== existingRole.name) {
                    const updateDataForSync = { ...syncPayload };
                    if (roleData.name !== existingRole.name) {
                        // Only add 'name' to payload if it's different from what's in DB,
                        // `updateRole` will decide if it can be changed (for system roles, it means display name)
                        updateDataForSync.name = roleData.name;
                    }

                    console.log(`[ensureDefaultRolesExist] Sincronizando perfil "${existingRole.name}" (original) para "${roleData.name}" (esperado). Payload para updateRole:`, JSON.stringify(updateDataForSync));
                    const updateResult = await updateRole(existingRole.id, updateDataForSync);
                    if (updateResult.success) {
                        console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" sincronizado.`);
                        createdOrUpdatedAny = true;
                    } else {
                        console.error(`[ensureDefaultRolesExist] Falha ao sincronizar perfil padrão "${roleData.name}": ${updateResult.message}`);
                        allSuccessful = false;
                        overallMessage = `Falha ao atualizar o perfil "${roleData.name}": ${updateResult.message}`;
                        break;
                    }
                } else {
                    console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" já está sincronizado.`);
                }
            }
        }
    } catch (error: any) {
        console.error("[ensureDefaultRolesExist] Erro catastrófico durante o processo de seed de perfis:", error);
        return { success: false, message: `Erro crítico no seed de perfis: ${error.message}` };
    }

    if (createdOrUpdatedAny && allSuccessful) {
        overallMessage = 'Perfis padrão verificados e/ou atualizados com sucesso.';
        revalidatePath('/admin/roles');
    }
    console.log(`[ensureDefaultRolesExist] Verificação de perfis padrão concluída. Sucesso: ${allSuccessful}. Mensagem: ${overallMessage}`);
    return { success: allSuccessful, message: overallMessage };
}
