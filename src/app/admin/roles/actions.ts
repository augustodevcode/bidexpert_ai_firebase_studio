
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; 
import admin from 'firebase-admin'; 
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where, limit, FieldValue } from 'firebase/firestore';
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema';

let dbAdmin: admin.firestore.Firestore;
let adminInitialized = false;

function initializeAdminSDK() {
  if (adminInitialized && dbAdmin) {
    return;
  }
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp();
      adminInitialized = true;
    } catch (error: any) {
      const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
      if (serviceAccountPath) {
        try {
          const serviceAccount = require(serviceAccountPath);
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
          adminInitialized = true;
        } catch (e: any) {
          console.error("[roles/actions] Falha ao init Admin SDK com path:", (e as Error).message);
        }
      } else if (error.code !== 'app/app-already-exists') {
         console.error("[roles/actions] Falha ao init Admin SDK (default):", error);
      } else {
         adminInitialized = true; 
      }
    }
  } else {
    adminInitialized = true;
  }
  if (adminInitialized) {
    try {
        dbAdmin = admin.firestore();
    } catch (e: any) {
        console.error("[roles/actions] Falha ao obter Firestore Admin DB instance:", e.message);
        adminInitialized = false;
    }
  }
  if (!adminInitialized || !dbAdmin) {
    console.error("[roles/actions] ALERTA: Firebase Admin SDK ou Firestore Admin DB não pôde ser inicializado.");
  }
}
initializeAdminSDK();

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
  if (!firestoreClientDB) {
    return { success: false, message: 'Erro de configuração: Banco de dados não disponível.' };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do perfil é obrigatório.' };
  }
  
  const normalizedName = data.name.trim().toUpperCase();
  const rolesRef = collection(firestoreClientDB, 'roles');
  const q = query(rolesRef, where('name_normalized', '==', normalizedName), limit(1));
  
  try {
    const existingRoleSnapshot = await getDocs(q);
    if (!existingRoleSnapshot.empty) {
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
    const docRef = await addDoc(rolesRef, newRoleData);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil criado com sucesso!', roleId: docRef.id };
  } catch (error: any) {
    return { success: false, message: `Falha ao criar perfil: ${error.message}` };
  }
}

export async function getRoles(): Promise<Role[]> {
  if (!firestoreClientDB) return [];
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
  if (!firestoreClientDB) return null;
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
  if (!firestoreClientDB) return null;
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
  if (!firestoreClientDB) {
    return { success: false, message: 'Erro de configuração: Banco de dados não disponível.' };
  }
  console.log(`[updateRole] Tentando atualizar role ID: ${id} com dados:`, JSON.stringify(data));

  try {
    const roleDocRef = doc(firestoreClientDB, 'roles', id);
    const currentRoleSnap = await getDoc(roleDocRef);
    if (!currentRoleSnap.exists()) {
        return { success: false, message: 'Perfil não encontrado para atualização.' };
    }
    const currentRoleData = currentRoleSnap.data() as Role;
    
    const systemRoleNamesUpper = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const isSystemRole = systemRoleNamesUpper.includes(currentRoleData.name_normalized?.toUpperCase() || '');

    const updatePayload: { [key: string]: any } = {};
    let hasChanges = false;

    if (data.name !== undefined && data.name.trim() !== currentRoleData.name) {
      const newNameTrimmed = data.name.trim();
      if (!newNameTrimmed) return { success: false, message: 'O nome do perfil não pode ser vazio.' };
      
      if (isSystemRole) {
        // Only sync display name for system roles if different, do not change name_normalized
        updatePayload.name = newNameTrimmed;
        console.log(`[updateRole - System Role ${currentRoleData.name_normalized}] Display name sync: "${currentRoleData.name}" -> "${newNameTrimmed}"`);
      } else {
        // For non-system roles, update name and name_normalized
        const newNormalizedName = newNameTrimmed.toUpperCase();
        if (newNormalizedName !== currentRoleData.name_normalized) {
            const rolesRef = collection(firestoreClientDB, 'roles');
            const q = query(rolesRef, where('name_normalized', '==', newNormalizedName), limit(1));
            const existingRoleSnapshot = await getDocs(q);
            if (!existingRoleSnapshot.empty && existingRoleSnapshot.docs[0].id !== id) {
              return { success: false, message: `Outro perfil com o nome "${newNameTrimmed}" (normalizado: ${newNormalizedName}) já existe.` };
            }
            updatePayload.name_normalized = newNormalizedName;
        }
        updatePayload.name = newNameTrimmed;
      }
      hasChanges = true;
    }

    if (data.description !== undefined && data.description.trim() !== (currentRoleData.description || '')) {
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
        updatePayload.updatedAt = serverTimestamp();
        console.log(`[updateRole] Payload final para Firestore para role ID ${id}:`, JSON.stringify(updatePayload));
        await updateDoc(roleDocRef, updatePayload); 
    } else {
        console.log(`[updateRole] Role ID: ${id} - Nenhuma alteração real detectada. Pulando update.`);
    }

    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`[updateRole] ERRO ao atualizar role ID ${id} no Firestore:`, error);
    return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!firestoreClientDB) return { success: false, message: 'Erro de configuração: Banco de dados não disponível.' };
  const roleToDelete = await getRole(id);
  if (roleToDelete) {
    const systemRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    const roleNameToCheck = roleToDelete.name_normalized || roleToDelete.name.toUpperCase();
    if (systemRoles.includes(roleNameToCheck)) {
        return { success: false, message: `O perfil "${roleToDelete.name}" é um perfil de sistema e não pode ser excluído.` };
    }
  } else {
     return { success: false, message: `Perfil com ID ${id} não encontrado para exclusão.` };
  }
  try {
    const roleDocRef = doc(firestoreClientDB, 'roles', id);
    await deleteDoc(roleDocRef);
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    return { success: false, message: `Falha ao excluir perfil: ${error.message}` };
  }
}

export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string }> {
  if (!firestoreClientDB) {
    return { success: false, message: 'Erro de configuração: Banco de dados não disponível para roles.' };
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
          const existingRole = await getRoleByName(roleData.name); 
          if (!existingRole) {
              const creationResult = await createRole(roleData);
              if (creationResult.success) {
                  createdOrUpdatedAny = true;
              } else {
                  allSuccessful = false;
                  overallMessage = `Falha ao criar o perfil "${roleData.name}".`;
                  break; 
              }
          } else {
              console.log(`[ensureDefaultRolesExist] Perfil "${existingRole.name}" (ID: ${existingRole.id}) já existe. Nome no DB: "${existingRole.name}", Nome no Código: "${roleData.name}", Norm. no DB: "${existingRole.name_normalized}"`);
              const currentPermissionsSorted = (existingRole.permissions || []).sort();
              const expectedPermissionsSorted = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
              
              const permissionsAreSame = expectedPermissionsSorted.length === currentPermissionsSorted.length && 
                                       expectedPermissionsSorted.every((p, i) => p === currentPermissionsSorted[i]);
              const descriptionIsSame = (existingRole.description || '') === (roleData.description || '');
              const nameIsSameAsInCode = existingRole.name === roleData.name; // Check if current display name matches the one in code

              const syncPayload: Partial<RoleFormData> = {};
              let needsSync = false;

              if (!nameIsSameAsInCode) {
                syncPayload.name = roleData.name; // Update display name to match code definition
                needsSync = true;
              }
              if (!descriptionIsSame) {
                  syncPayload.description = roleData.description;
                  needsSync = true;
              }
              if (!permissionsAreSame) {
                  syncPayload.permissions = expectedPermissionsSorted;
                  needsSync = true;
              }

              if (needsSync) {
                  console.log(`[ensureDefaultRolesExist] Sincronizando perfil "${existingRole.name}". Payload para updateRole:`, JSON.stringify(syncPayload));
                  const updateResult = await updateRole(existingRole.id, syncPayload);
                  if (updateResult.success) {
                      createdOrUpdatedAny = true;
                  } else {
                      allSuccessful = false;
                      overallMessage = `Falha ao atualizar o perfil "${existingRole.name}". Detalhe: ${updateResult.message}`;
                      break;
                  }
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
  } else if (!allSuccessful) {
      // message already set
  }
  return { success: allSuccessful, message: overallMessage };
}

    
