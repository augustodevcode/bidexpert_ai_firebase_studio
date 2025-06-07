
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
  console.log(`[createRole] Attempting to create role: ${data.name} with permissions:`, data.permissions);
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

    const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));

    const newRoleData = {
      name: data.name.trim(),
      name_normalized: normalizedName, // Store the uppercase version for case-insensitive checks
      description: data.description?.trim() || '',
      permissions: validPermissions,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'roles'), newRoleData);
    console.log(`[createRole] Role "${data.name}" created successfully! ID: ${docRef.id}`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil criado com sucesso!', roleId: docRef.id };
  } catch (error: any) {
    console.error(`[createRole] ERROR creating role "${data.name}":`, error.message, error.code);
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
        name_normalized: data.name_normalized,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Role;
    });
    console.log(`[getRoles] ${rolesList.length} roles found.`);
    return rolesList;
  } catch (error: any) {
    console.error("[getRoles] ERROR fetching roles:", error.message, error.code);
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
        name_normalized: data.name_normalized,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Role;
    }
    return null;
  } catch (error: any) {
    console.error(`[getRole] ERROR fetching role ${id}:`, error.message, error.code);
    return null;
  }
}

export async function getRoleByName(roleName: string): Promise<Role | null> {
  if (!roleName || roleName.trim() === '') {
    console.warn(`[getRoleByName] Attempt to fetch role with empty or null name.`);
    return null;
  }
  const normalizedQueryName = roleName.trim().toUpperCase();
  console.log(`[getRoleByName] Fetching role with name_normalized: "${normalizedQueryName}"`);
  try {
    const rolesRef = collection(db, 'roles');
    const q = query(rolesRef, where('name_normalized', '==', normalizedQueryName), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      console.log(`[getRoleByName] Role "${normalizedQueryName}" FOUND. ID: ${docSnap.id}`);
      return {
        id: docSnap.id,
        name: data.name,
        name_normalized: data.name_normalized,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Role;
    }
    console.warn(`[getRoleByName] Role with name_normalized "${normalizedQueryName}" NOT found.`);
    return null;
  } catch (error: any) {
    console.error(`[getRoleByName] ERROR fetching role "${normalizedQueryName}":`, error.message, error.code);
    return null;
  }
}

export async function updateRole(
  id: string,
  data: Partial<RoleFormData> 
): Promise<{ success: boolean; message: string }> {
  console.log(`[updateRole] Attempting to update role ID: ${id} with data:`, JSON.stringify(data));

  try {
    const roleDocRef = doc(db, 'roles', id);
    const currentRoleSnap = await getDoc(roleDocRef);
    if (!currentRoleSnap.exists()) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;
    
    const systemRoleNamesUpper = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const isSystemRole = systemRoleNamesUpper.includes(currentRoleData.name_normalized?.toUpperCase() || '');

    const updatePayload: Partial<Omit<Role, 'id' | 'createdAt'>> = {};
    let hasChanges = false;

    if (data.name !== undefined && data.name.trim() !== currentRoleData.name) {
      if (isSystemRole) {
        console.warn(`[updateRole] Attempt to change name for system role ${currentRoleData.name} to ${data.name.trim()} is generally restricted for name_normalized. Only display name might change.`);
        // For system roles, we ONLY update the display name if it's different,
        // and we DO NOT update name_normalized via this path.
        // The Firestore rules should enforce that name_normalized for default roles cannot be changed by isAdminEmail.
        updatePayload.name = data.name.trim(); // Update display name
        // updatePayload.name_normalized remains unchanged for system roles via this action flow
        hasChanges = true;
      } else {
        // For non-system roles:
        if (!data.name || data.name.trim() === '') {
            return { success: false, message: 'O nome do perfil não pode ser vazio.' };
        }
        const newNormalizedName = data.name.trim().toUpperCase();
        if (newNormalizedName !== currentRoleData.name_normalized) {
            const rolesRef = collection(db, 'roles');
            const q = query(rolesRef, where('name_normalized', '==', newNormalizedName), limit(1));
            const existingRoleSnapshot = await getDocs(q);
            if (!existingRoleSnapshot.empty && existingRoleSnapshot.docs[0].id !== id) {
              return { success: false, message: `Outro perfil com o nome "${data.name.trim()}" (normalizado: ${newNormalizedName}) já existe.` };
            }
            updatePayload.name_normalized = newNormalizedName;
        }
        updatePayload.name = data.name.trim();
        hasChanges = true;
      }
    } else if (isSystemRole) {
      // If name is not in data, but we are updating a system role, ensure name/name_normalized are present
      // in the payload for Firestore rules, matching existing values.
      // This is only needed if the rules strictly require name/name_normalized to be present in request.resource.data
      // For "Case 2" in rules, we ensure they match resource.data
      // updatePayload.name = currentRoleData.name;
      // updatePayload.name_normalized = currentRoleData.name_normalized;
    }

    if (data.description !== undefined && data.description.trim() !== (currentRoleData.description || '')) {
        updatePayload.description = data.description.trim();
        hasChanges = true;
    }
    if (data.permissions) {
      const currentPermissions = currentRoleData.permissions || [];
      const newPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
      
      const permissionsAreSame = newPermissions.length === currentPermissions.length && 
                                 newPermissions.every((p, i) => p === [...currentPermissions].sort()[i]);
      
      if (!permissionsAreSame) {
        updatePayload.permissions = newPermissions;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
        updatePayload.updatedAt = serverTimestamp() as Timestamp;
        console.log(`[updateRole] For role ID ${id} (System: ${isSystemRole}), effective updatePayload to Firestore:`, JSON.stringify(updatePayload));
        await updateDoc(roleDocRef, updatePayload as any); 
        console.log(`[updateRole] Role ID: ${id} updated successfully.`);
    } else {
        console.log(`[updateRole] Role ID: ${id} - No actual changes detected in name, description, or permissions. Skipping Firestore update, but revalidating paths.`);
    }

    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`[updateRole] ERROR updating role ID ${id}:`, error.message, error.code);
    if (error.details) console.error(`[updateRole] Details:`, error.details);
    return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[deleteRole] Attempting to delete role ID: ${id}`);
  const roleToDelete = await getRole(id);
  if (roleToDelete) {
    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const roleNameToCheck = roleToDelete.name_normalized || roleToDelete.name.toUpperCase();
    if (systemRoles.includes(roleNameToCheck)) {
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
    console.error(`[deleteRole] ERROR deleting role ID ${id}:`, error.message, error.code);
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
                console.log(`[ensureDefaultRolesExist] Perfil "${existingRole.name}" (ID: ${existingRole.id}) já existe. Verificando descrição e permissões...`);
                const currentPermissionsSorted = (existingRole.permissions || []).sort();
                const expectedPermissionsSorted = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
                
                const permissionsAreSame = expectedPermissionsSorted.length === currentPermissionsSorted.length && 
                                         expectedPermissionsSorted.every((p, i) => p === currentPermissionsSorted[i]);
                const descriptionIsSame = (existingRole.description || '') === (roleData.description || '');
                // For default roles, we don't try to change 'name' or 'name_normalized' during sync,
                // only description and permissions.
                // The 'name' in defaultRolesData is the canonical display name.

                const syncPayload: Partial<RoleFormData> = {};
                let needsSync = false;

                if (!descriptionIsSame) {
                    syncPayload.description = roleData.description;
                    needsSync = true;
                }
                if (!permissionsAreSame) {
                    syncPayload.permissions = expectedPermissionsSorted;
                    needsSync = true;
                }
                 // If the display name in defaultRolesData differs from what's in DB (e.g. casing),
                 // include it in the sync so updateRole can potentially update the display name.
                if (roleData.name !== existingRole.name) {
                    syncPayload.name = roleData.name; // updateRole will handle if this change is allowed for system roles
                    needsSync = true;
                }


                if (needsSync) {
                    console.log(`[ensureDefaultRolesExist] Sincronizando perfil "${existingRole.name}". Payload para updateRole:`, JSON.stringify(syncPayload));
                    const updateResult = await updateRole(existingRole.id, syncPayload);
                    if (updateResult.success) {
                        console.log(`[ensureDefaultRolesExist] Perfil "${existingRole.name}" sincronizado.`);
                        createdOrUpdatedAny = true;
                    } else {
                        console.error(`[ensureDefaultRolesExist] Falha ao sincronizar perfil padrão "${existingRole.name}": ${updateResult.message}`);
                        allSuccessful = false;
                        overallMessage = `Falha ao atualizar o perfil "${existingRole.name}".`;
                        break;
                    }
                } else {
                    console.log(`[ensureDefaultRolesExist] Perfil "${existingRole.name}" já está sincronizado.`);
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
    } else if (!allSuccessful) {
        // message already set
    } else {
        overallMessage = 'Perfis padrão já estavam sincronizados.';
    }
    console.log(`[ensureDefaultRolesExist] Verificação de perfis padrão concluída. Sucesso: ${allSuccessful}. Mensagem: ${overallMessage}`);
    return { success: allSuccessful, message: overallMessage };
}

    