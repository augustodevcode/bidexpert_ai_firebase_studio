
'use server';

import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase/admin'; // SDK Admin para escritas
import { collection, getDocs, doc, getDoc, query, orderBy, Timestamp as ClientTimestamp, where, limit, FieldValue as ClientFieldValue } from 'firebase/firestore';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente para leituras
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema';

// A inicialização do Admin SDK foi movida para @/lib/firebase/admin.ts

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
  console.warn(`[roles/actions] Could not convert timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  if (!dbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível para createRole.' };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do perfil é obrigatório.' };
  }

  const normalizedName = data.name.trim().toUpperCase();
  const rolesRef = dbAdmin.collection('roles');
  const q = rolesRef.where('name_normalized', '==', normalizedName).limit(1);

  try {
    const existingRoleSnapshot = await q.get();
    if (!existingRoleSnapshot.empty) {
      return { success: false, message: `O perfil com o nome "${data.name.trim()}" já existe.` };
    }
    const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
    const newRoleData = {
      name: data.name.trim(),
      name_normalized: normalizedName,
      description: data.description?.trim() || '',
      permissions: validPermissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await rolesRef.add(newRoleData);
    console.log(`[createRole - Admin SDK] Role "${data.name}" created with ID: ${docRef.id}`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil criado com sucesso!', roleId: docRef.id };
  } catch (error: any) {
    console.error("[createRole - Admin SDK] Error creating role:", error);
    return { success: false, message: `Falha ao criar perfil: ${error.message}` };
  }
}

export async function getRoles(): Promise<Role[]> {
  if (!firestoreClientDB) {
      console.error("[getRoles] Firestore client DB not initialized. Returning empty array.");
      return [];
  }
  try {
    const rolesCollection = collection(firestoreClientDB, 'roles');
    const q = query(rolesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
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
  } catch (error: any) {
    console.error("[getRoles] ERROR fetching roles:", error);
    return [];
  }
}

export async function getRole(id: string): Promise<Role | null> {
  if (!firestoreClientDB) {
    console.error(`[getRole for ID ${id}] Firestore client DB not initialized. Returning null.`);
    return null;
  }
  try {
    const roleDocRef = doc(firestoreClientDB, 'roles', id);
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
    console.error(`[getRole] ERROR fetching role ${id}:`, error);
    return null;
  }
}

export async function getRoleByName(roleName: string): Promise<Role | null> {
  if (!firestoreClientDB) {
    console.error(`[getRoleByName for ${roleName}] Firestore client DB not initialized. Returning null.`);
    return null;
  }
  if (!roleName || roleName.trim() === '') return null;

  const normalizedQueryName = roleName.trim().toUpperCase();
  try {
    const rolesRef = collection(firestoreClientDB, 'roles');
    const q = query(rolesRef, where('name_normalized', '==', normalizedQueryName), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
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
    console.error(`[getRoleByName] ERROR fetching role "${normalizedQueryName}":`, error);
    return null;
  }
}

export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  if (!dbAdmin) {
    console.error(`[updateRole - Admin SDK] dbAdmin not initialized for role ID: ${id}`);
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível para updateRole.' };
  }
  
  console.log(`[updateRole - Admin SDK] Attempting to update role ID: ${id} with data:`, JSON.stringify(data));

  try {
    const rolesCollectionAdmin = dbAdmin.collection('roles');
    const roleDocRefAdmin = rolesCollectionAdmin.doc(id);
    
    const currentRoleSnap = await roleDocRefAdmin.get();
    if (!currentRoleSnap.exists) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;
    console.log(`[updateRole - Admin SDK] Current role data for ID ${id}:`, JSON.stringify(currentRoleData));

    const systemRoleNamesUpper = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const currentNormalizedNameUpper = currentRoleData.name_normalized?.toUpperCase();
    const isSystemRole = currentNormalizedNameUpper ? systemRoleNamesUpper.includes(currentNormalizedNameUpper) : false;
    
    const updatePayload: { [key: string]: any } = {};
    let hasChanges = false;

    if (data.name !== undefined && data.name.trim() !== currentRoleData.name) {
      const newNameTrimmed = data.name.trim();
      if (!newNameTrimmed) return { success: false, message: 'O nome do perfil não pode ser vazio.' };
      
      updatePayload.name = newNameTrimmed; // Always update display name if provided and different
      
      if (!isSystemRole) { // Only update name_normalized for non-system roles
        const newNormalizedName = newNameTrimmed.toUpperCase();
         if (newNormalizedName !== currentRoleData.name_normalized) {
            const q = rolesCollectionAdmin.where('name_normalized', '==', newNormalizedName).limit(1);
            const existingRoleSnapshot = await q.get();
            if (!existingRoleSnapshot.empty && existingRoleSnapshot.docs[0].id !== id) {
              return { success: false, message: `Outro perfil com o nome "${newNameTrimmed}" (normalizado: ${newNormalizedName}) já existe.` };
            }
            updatePayload.name_normalized = newNormalizedName;
        }
      } else {
         console.log(`[updateRole - Admin SDK] System role ${currentRoleData.name}. name_normalized will not be changed by this update path. Display name can be updated.`);
         // Ensure name_normalized is NOT in payload if it's a system role AND name_normalized hasn't changed
         if (updatePayload.name_normalized && updatePayload.name_normalized === currentRoleData.name_normalized) {
           delete updatePayload.name_normalized;
         }
      }
      hasChanges = true;
    }

    if (data.description !== undefined && (data.description.trim() || '') !== (currentRoleData.description || '')) {
        updatePayload.description = data.description.trim();
        hasChanges = true;
    }

    if (data.permissions) {
      const currentPermissionsSorted = (currentRoleData.permissions || []).sort();
      const newPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
      const permissionsAreSame = newPermissions.length === currentPermissionsSorted.length &&
                                 newPermissions.every((p, i) => p === currentPermissionsSorted[i]);
      if (!permissionsAreSame) {
        updatePayload.permissions = newPermissions;
        hasChanges = true;
      }
    }

    if (hasChanges) {
        updatePayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        console.log(`[updateRole - Admin SDK] ATUALIZANDO role ID ${id} com payload:`, JSON.stringify(updatePayload));
        await roleDocRefAdmin.update(updatePayload);
        console.log(`[updateRole - Admin SDK] Role ID ${id} atualizado com sucesso.`);
    } else {
        console.log(`[updateRole - Admin SDK] Role ID: ${id} - Nenhuma alteração detectada no payload para Firestore. Pulando update.`);
    }

    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`[updateRole - Admin SDK] ERRO ao atualizar role ID ${id} usando Admin SDK:`, error);
    return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!dbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível para deleteRole.' };
  }
  
  const roleDocRefAdmin = dbAdmin.collection('roles').doc(id);
  const roleToDeleteSnap = await roleDocRefAdmin.get();
  
  if (roleToDeleteSnap.exists) {
    const roleToDeleteData = roleToDeleteSnap.data() as Role;
    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const roleNameToCheck = roleToDeleteData.name_normalized || roleToDeleteData.name.toUpperCase();
    if (systemRoles.includes(roleNameToCheck)) {
        return { success: false, message: `O perfil "${roleToDeleteData.name}" é um perfil de sistema e não pode ser excluído.` };
    }
  } else {
     return { success: false, message: `Perfil com ID ${id} não encontrado para exclusão.` };
  }

  try {
    await roleDocRefAdmin.delete();
    console.log(`[deleteRole - Admin SDK] Role ID ${id} excluído com sucesso.`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    console.error("[deleteRole - Admin SDK] Error:", error);
    return { success: false, message: `Falha ao excluir perfil: ${error.message}` };
  }
}

export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string }> {
  if (!dbAdmin) {
    console.error("[ensureDefaultRolesExist] dbAdmin não inicializado. Verifique a inicialização centralizada.");
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível para ensureDefaultRolesExist.' };
  }
  console.log("[ensureDefaultRolesExist] Verificando e criando/sincronizando perfis padrão...");
  
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
          const normalizedName = roleData.name.trim().toUpperCase();
          const rolesRefAdmin = dbAdmin.collection('roles');
          const qAdmin = rolesRefAdmin.where('name_normalized', '==', normalizedName).limit(1);
          const existingRoleSnapshotAdmin = await qAdmin.get();
          let existingRoleDocId: string | undefined;
          let existingRoleData: Role | undefined;

          if (!existingRoleSnapshotAdmin.empty) {
            const doc = existingRoleSnapshotAdmin.docs[0];
            existingRoleDocId = doc.id;
            existingRoleData = doc.data() as Role;
            console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" (Norm: ${normalizedName}) encontrado com ID: ${existingRoleDocId}. Nome DB: "${existingRoleData.name}", Norm DB: "${existingRoleData.name_normalized}"`);
          }

          if (!existingRoleData) {
              console.log(`[ensureDefaultRolesExist] Perfil "${roleData.name}" não encontrado. Criando...`);
              const creationResult = await createRole(roleData);
              if (creationResult.success) {
                  createdOrUpdatedAny = true;
              } else {
                  allSuccessful = false;
                  overallMessage = `Falha ao criar o perfil "${roleData.name}". Detalhe: ${creationResult.message}`;
                  console.error(`[ensureDefaultRolesExist] ${overallMessage}`);
                  break; 
              }
          } else {
              const syncPayload: Partial<RoleFormData> = {};
              let needsSync = false;

              // Sincronizar o nome de exibição se for diferente
              if (roleData.name !== existingRoleData.name) {
                syncPayload.name = roleData.name; // updateRole cuidará de não mudar name_normalized para system roles
                needsSync = true;
                 console.log(`[ensureDefaultRolesExist] Perfil "${existingRoleData.name_normalized}": Nome de exibição precisa de sincronização. DB: "${existingRoleData.name}", Código: "${roleData.name}"`);
              }
              
              if ((roleData.description || '') !== (existingRoleData.description || '')) {
                  syncPayload.description = roleData.description || '';
                  needsSync = true;
                  console.log(`[ensureDefaultRolesExist] Perfil "${existingRoleData.name_normalized}": Descrição precisa de sincronização.`);
              }
              
              const currentPermissionsSorted = [...(existingRoleData.permissions || [])].sort();
              const expectedPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
              const expectedPermissionsSorted = [...expectedPermissions].sort();
              
              const permissionsAreSame = expectedPermissionsSorted.length === currentPermissionsSorted.length &&
                                       expectedPermissionsSorted.every((p, i) => p === currentPermissionsSorted[i]);
              if (!permissionsAreSame) {
                  syncPayload.permissions = expectedPermissions;
                  needsSync = true;
                  console.log(`[ensureDefaultRolesExist] Perfil "${existingRoleData.name_normalized}": Permissões precisam de sincronização. DB: ${JSON.stringify(currentPermissionsSorted)}, Código: ${JSON.stringify(expectedPermissionsSorted)}`);
              }
              
              if (needsSync) {
                  console.log(`[ensureDefaultRolesExist] Sincronizando perfil padrão "${existingRoleData.name}". Payload para updateRole:`, JSON.stringify(syncPayload));
                  const updateResult = await updateRole(existingRoleDocId!, syncPayload); 
                  if (updateResult.success) {
                      createdOrUpdatedAny = true;
                  } else {
                      allSuccessful = false;
                      overallMessage = `Falha ao atualizar o perfil "${existingRoleData.name}". Detalhe: ${updateResult.message}`;
                      console.error(`[ensureDefaultRolesExist] ${overallMessage}`);
                      break; 
                  }
              } else {
                 console.log(`[ensureDefaultRolesExist] Perfil "${existingRoleData.name}" já está sincronizado.`);
              }
          }
      }
  } catch (error: any) {
      console.error("[ensureDefaultRolesExist] Erro catastrófico durante o seed de perfis:", error);
      return { success: false, message: `Erro crítico no seed de perfis: ${error.message}` };
  }

  if (createdOrUpdatedAny && allSuccessful) {
      overallMessage = 'Perfis padrão verificados e/ou atualizados com sucesso.';
      revalidatePath('/admin/roles');
  }
  console.log(`[ensureDefaultRolesExist] Concluído. Sucesso: ${allSuccessful}, Mensagem: ${overallMessage}`);
  return { success: allSuccessful, message: overallMessage };
}
