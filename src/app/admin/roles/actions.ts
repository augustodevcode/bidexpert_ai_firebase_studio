
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
  console.log(`[updateRole] Tentando atualizar perfil ID: ${id} com dados:`, JSON.stringify(data));

  try {
    const roleDocRef = doc(db, 'roles', id);
    const currentRoleSnap = await getDoc(roleDocRef);
    if (!currentRoleSnap.exists()) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;
    const currentRoleNameUpper = currentRoleData.name.toUpperCase();

    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const isSystemRole = systemRoles.includes(currentRoleNameUpper);

    const updateData: Partial<Omit<Role, 'id' | 'createdAt'>> & { name_normalized?: string } = {};
    
    if (data.name !== undefined && data.name.trim() !== currentRoleData.name) {
      if (isSystemRole) {
        // For system roles, allow updating the display 'name' but NOT 'name_normalized' which is its identity.
        updateData.name = data.name.trim();
        // 'name_normalized' is intentionally NOT set here to keep it fixed for system roles.
        // Firestore rules will prevent changing 'name_normalized' for system roles anyway.
        console.log(`[updateRole] Atualizando nome de exibição do perfil de sistema ${currentRoleNameUpper} para ${updateData.name}`);
      } else {
        // For non-system roles, if name changes, update both name and name_normalized.
        // Check for existing role with the new name before proceeding.
        const newNormalizedName = data.name.trim().toUpperCase();
        const rolesRef = collection(db, 'roles');
        const q = query(rolesRef, where('name_normalized', '==', newNormalizedName), limit(1));
        const existingRoleSnapshot = await getDocs(q);
        if (!existingRoleSnapshot.empty && existingRoleSnapshot.docs[0].id !== id) {
          return { success: false, message: `Outro perfil com o nome "${data.name.trim()}" já existe.` };
        }
        updateData.name = data.name.trim();
        updateData.name_normalized = newNormalizedName;
      }
    } else if (data.name !== undefined && data.name.trim() === currentRoleData.name && currentRoleData.name_normalized !== currentRoleData.name.toUpperCase()) {
      // This case handles if only the case of name_normalized needs fixing for an existing name (non-system roles)
       if (!isSystemRole) {
         updateData.name_normalized = currentRoleData.name.trim().toUpperCase();
       }
    }

    if (data.description !== undefined && data.description.trim() !== (currentRoleData.description || '')) {
        updateData.description = data.description.trim();
    }
    if (data.permissions) {
      const currentPermissions = currentRoleData.permissions || [];
      const newPermissions = data.permissions.filter(p => predefinedPermissions.some(pp => pp.id === p));
      // Check if permissions are actually different before adding to update
      const permissionsAreSame = newPermissions.length === currentPermissions.length && newPermissions.every(p => currentPermissions.includes(p));
      if (!permissionsAreSame) {
        updateData.permissions = newPermissions;
      }
    }
    
    if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = serverTimestamp();
        await updateDoc(roleDocRef, updateData as any); 
        console.log(`[updateRole] Perfil ID: ${id} atualizado com sucesso com campos:`, Object.keys(updateData));
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
    let overallMessage = 'Perfis padrão verificados/atualizados com sucesso.';

    try {
        for (const roleData of defaultRolesData) {
            console.log(`[ensureDefaultRolesExist] Verificando perfil: ${roleData.name}`);
            const existingRole = await getRoleByName(roleData.name);
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
                console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" já existe (ID: ${existingRole.id}). Verificando descrição e permissões...`);
                const currentPermissions = existingRole.permissions || [];
                const expectedPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
                
                const permissionsAreSame = expectedPermissions.length === currentPermissions.length && expectedPermissions.every(p => currentPermissions.includes(p));
                const descriptionIsSame = (existingRole.description || '') === (roleData.description || '');

                const updatePayload: Partial<RoleFormData> = {};
                let needsSync = false;

                if (!descriptionIsSame) {
                    updatePayload.description = roleData.description;
                    needsSync = true;
                }
                if (!permissionsAreSame) {
                    updatePayload.permissions = expectedPermissions;
                    needsSync = true;
                }

                if (needsSync) {
                    console.log(`[ensureDefaultRolesExist] Sincronizando descrição/permissões para o perfil "${roleData.name}". Payload:`, updatePayload);
                    // Não passamos 'name' aqui, pois 'updateRole' lida com a lógica de nome para perfis de sistema.
                    const updateResult = await updateRole(existingRole.id, updatePayload);
                    if (updateResult.success) {
                        console.log(`[ensureDefaultRolesExist] Descrição/permissões do perfil "${roleData.name}" sincronizadas.`);
                        createdOrUpdatedAny = true;
                    } else {
                        console.error(`[ensureDefaultRolesExist] Falha ao sincronizar perfil padrão "${roleData.name}": ${updateResult.message}`);
                        allSuccessful = false;
                        overallMessage = `Falha ao atualizar o perfil "${roleData.name}".`;
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
        revalidatePath('/admin/roles');
    }
    console.log(`[ensureDefaultRolesExist] Verificação de perfis padrão concluída. Sucesso: ${allSuccessful}. Mensagem: ${overallMessage}`);
    return { success: allSuccessful, message: overallMessage };
}
