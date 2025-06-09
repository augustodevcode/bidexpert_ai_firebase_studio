
'use server';

import { revalidatePath } from 'next/cache';
import { 
  ensureAdminInitialized, 
  FieldValue as AdminFieldValue, // Renomeado para ServerFieldValue para clareza
  Timestamp as ServerTimestamp 
} from '@/lib/firebase/admin'; 
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp as ClientTimestamp, // Timestamp do SDK do cliente
  where, 
  limit 
} from 'firebase/firestore';
// A importação dbAdmin de '@/lib/firebase/admin' é a instância do Admin SDK Firestore
// A importação db de '@/lib/firebase' é a instância do Client SDK Firestore
import { db as firestoreClientDB } from '@/lib/firebase'; 
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema';

// Helper function to convert Firestore Timestamps (Admin or Client) to Date, or handle existing Dates
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date(); 
  if (timestampField instanceof ServerTimestamp || timestampField instanceof ClientTimestamp) { 
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new ServerTimestamp(timestampField.seconds, timestampField.nanoseconds).toDate(); 
  }
  if (timestampField instanceof Date) {
    return timestampField;
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`[roles/actions] Could not convert timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  const { dbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !dbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do perfil é obrigatório.' };
  }

  const normalizedName = data.name.trim().toUpperCase();
  const rolesRef = dbAdmin.collection('roles');
  const q = query(rolesRef, where('name_normalized', '==', normalizedName), limit(1));

  try {
    const existingRoleSnapshot = await getDocs(q); // Usar getDocs com query de Admin SDK
    if (!existingRoleSnapshot.empty) {
      return { success: false, message: `O perfil com o nome "${data.name.trim()}" já existe.` };
    }
    const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
    const newRoleData = {
      name: data.name.trim(),
      name_normalized: normalizedName,
      description: data.description?.trim() || '',
      permissions: validPermissions,
      createdAt: AdminFieldValue.serverTimestamp(), 
      updatedAt: AdminFieldValue.serverTimestamp(), 
    };
    const docRef = await addDoc(rolesRef, newRoleData); // Usar addDoc com Admin SDK
    console.log(`[createRole - Admin SDK] Role "${data.name}" created with ID: ${docRef.id}`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil criado com sucesso!', roleId: docRef.id };
  } catch (error: any) {
    console.error("[createRole - Admin SDK] Error creating role:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao criar perfil: ${error.message}` };
  }
}

export async function getRoles(): Promise<Role[]> {
  // Para leituras que não exigem privilégios de admin, podemos usar o client SDK ou o admin SDK.
  // Usar o client SDK aqui é aceitável se esta função puder ser chamada de contextos onde o admin não é necessário.
  // Mas para consistência em server actions, usar dbAdmin após ensureAdminInitialized é mais robusto.
  const { dbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !dbAdmin) {
      console.warn("[getRoles] Admin SDK Firestore não disponível. Retornando array vazio.");
      return [];
  }
  try {
    const rolesCollection = collection(dbAdmin, 'roles'); // Usar dbAdmin
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
    console.error("[getRoles] ERROR fetching roles:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

export async function getRole(id: string): Promise<Role | null> {
  const { dbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !dbAdmin) {
    console.warn(`[getRole for ID ${id}] Admin SDK Firestore não disponível. Retornando null.`);
    return null;
  }
  try {
    const roleDocRef = doc(dbAdmin, 'roles', id); // Usar dbAdmin
    const docSnap = await getDoc(roleDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data()!; 
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
    console.error(`[getRole] ERROR fetching role ${id}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function getRoleByName(roleName: string): Promise<Role | null> {
  const { dbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !dbAdmin) {
    console.warn(`[getRoleByName for ${roleName}] Admin SDK Firestore não disponível. Retornando null.`);
    return null;
  }
  if (!roleName || roleName.trim() === '') return null;

  const normalizedQueryName = roleName.trim().toUpperCase();
  try {
    const rolesRef = collection(dbAdmin, 'roles'); // Usar dbAdmin
    const q = query(rolesRef, where('name_normalized', '==', normalizedQueryName), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
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
    console.error(`[getRoleByName] ERROR fetching role "${normalizedQueryName}":`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !dbAdmin) {
    console.error(`[updateRole - Admin SDK] dbAdmin não inicializado para role ID: ${id}`);
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  
  console.log(`[updateRole - Admin SDK] Attempting to update role ID: ${id} with data:`, JSON.stringify(data));

  try {
    const rolesCollectionAdmin = dbAdmin.collection('roles');
    const roleDocRefAdmin = doc(rolesCollectionAdmin, id);
    
    const currentRoleSnap = await getDoc(roleDocRefAdmin); // Usar getDoc com Admin SDK
    if (!currentRoleSnap.exists()) {
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
      
      updatePayload.name = newNameTrimmed; 
      
      if (!isSystemRole) { 
        const newNormalizedName = newNameTrimmed.toUpperCase();
         if (newNormalizedName !== currentRoleData.name_normalized) {
            const q = query(rolesCollectionAdmin, where('name_normalized', '==', newNormalizedName), limit(1));
            const existingRoleSnapshot = await getDocs(q);
            if (!existingRoleSnapshot.empty && existingRoleSnapshot.docs[0].id !== id) {
              return { success: false, message: `Outro perfil com o nome "${newNameTrimmed}" (normalizado: ${newNormalizedName}) já existe.` };
            }
            updatePayload.name_normalized = newNormalizedName;
        }
      } else {
         console.log(`[updateRole - Admin SDK] System role ${currentRoleData.name}. name_normalized will not be changed by this update path. Display name can be updated.`);
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
      const currentPermissionsSorted = [...(currentRoleData.permissions || [])].sort();
      const newPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
      const permissionsAreSame = newPermissions.length === currentPermissionsSorted.length &&
                                 newPermissions.every((p, i) => p === currentPermissionsSorted[i]);
      if (!permissionsAreSame) {
        updatePayload.permissions = newPermissions;
        hasChanges = true;
      }
    }

    if (hasChanges) {
        updatePayload.updatedAt = AdminFieldValue.serverTimestamp(); 
        console.log(`[updateRole - Admin SDK] ATUALIZANDO role ID ${id} com payload:`, JSON.stringify(updatePayload));
        await updateDoc(roleDocRefAdmin, updatePayload); // Usar updateDoc com Admin SDK
        console.log(`[updateRole - Admin SDK] Role ID ${id} atualizado com sucesso.`);
    } else {
        console.log(`[updateRole - Admin SDK] Role ID: ${id} - Nenhuma alteração detectada no payload para Firestore. Pulando update.`);
    }

    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`[updateRole - Admin SDK] ERRO ao atualizar role ID ${id} usando Admin SDK:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !dbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  
  const roleDocRefAdmin = doc(dbAdmin, 'roles', id); // Usar dbAdmin
  const roleToDeleteSnap = await getDoc(roleDocRefAdmin);
  
  if (roleToDeleteSnap.exists()) {
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
    await deleteDoc(roleDocRefAdmin); // Usar deleteDoc com Admin SDK
    console.log(`[deleteRole - Admin SDK] Role ID ${id} excluído com sucesso.`);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    console.error("[deleteRole - Admin SDK] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao excluir perfil: ${error.message}` };
  }
}

export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string }> {
  const { dbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !dbAdmin) {
    console.error("[ensureDefaultRolesExist] dbAdmin não inicializado. Verifique a inicialização centralizada.");
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
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
          const rolesRefAdmin = collection(dbAdmin, 'roles'); // Usar dbAdmin
          const qAdmin = query(rolesRefAdmin, where('name_normalized', '==', normalizedName), limit(1));
          const existingRoleSnapshotAdmin = await getDocs(qAdmin);
          let existingRoleDocId: string | undefined;
          let existingRoleData: Role | undefined;

          if (!existingRoleSnapshotAdmin.empty) {
            const docSnap = existingRoleSnapshotAdmin.docs[0];
            existingRoleDocId = docSnap.id;
            existingRoleData = docSnap.data() as Role;
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

              if (roleData.name !== existingRoleData.name) { 
                syncPayload.name = roleData.name; 
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
                  // existingRoleDocId é garantido aqui, pois existingRoleData existe
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
      console.error("[ensureDefaultRolesExist] Erro catastrófico durante o seed de perfis:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return { success: false, message: `Erro crítico no seed de perfis: ${error.message}` };
  }

  if (createdOrUpdatedAny && allSuccessful) {
      overallMessage = 'Perfis padrão verificados e/ou atualizados com sucesso.';
      revalidatePath('/admin/roles');
  }
  console.log(`[ensureDefaultRolesExist] Concluído. Sucesso: ${allSuccessful}, Mensagem: ${overallMessage}`);
  return { success: allSuccessful, message: overallMessage };
}
      
    

    