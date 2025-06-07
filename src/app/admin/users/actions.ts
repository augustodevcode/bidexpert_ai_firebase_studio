
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente
import admin from 'firebase-admin'; // Import Admin SDK
import { 
  collection, addDoc, getDocs, doc, getDoc, updateDoc, 
  deleteDoc as deleteFirestoreDoc, // Renomeado para evitar conflito com deleteUser da SDK Admin
  serverTimestamp, query, orderBy, Timestamp, where, limit, FieldValue 
} from 'firebase/firestore';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName, ensureDefaultRolesExist, getRole } from '@/app/admin/roles/actions';
import type { UserFormValues } from './user-form-schema'; // Schema para novo usuário

// --- Início da Inicialização do Firebase Admin SDK ---
let dbAdmin: admin.firestore.Firestore;
let authAdmin: admin.auth.Auth;
let adminInitialized = false;

function initializeAdminSDK() {
  if (adminInitialized && dbAdmin && authAdmin) {
    console.log("[users/actions] Firebase Admin SDK e instâncias já inicializados.");
    return;
  }

  if (admin.apps.length === 0) {
    console.log("[users/actions] Tentando inicializar Firebase Admin SDK...");
    try {
      admin.initializeApp();
      console.log("[users/actions] Firebase Admin SDK inicializado usando GOOGLE_APPLICATION_CREDENTIALS.");
      adminInitialized = true;
    } catch (error: any) {
      if (error.code === 'app/no-app' && error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
        console.warn("[users/actions] GOOGLE_APPLICATION_CREDENTIALS não configurado ou falhou. Tentando FIREBASE_ADMIN_SDK_PATH.");
        const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
        if (serviceAccountPath) {
          try {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log("[users/actions] Firebase Admin SDK inicializado usando FIREBASE_ADMIN_SDK_PATH.");
            adminInitialized = true;
          } catch (e: any) {
            console.error("[users/actions] Falha ao inicializar Firebase Admin SDK com FIREBASE_ADMIN_SDK_PATH:", (e as Error).message);
          }
        } else {
          console.warn("[users/actions] FIREBASE_ADMIN_SDK_PATH não configurado.");
        }
      } else if (error.code !== 'app/app-already-exists') {
         console.error("[users/actions] Falha desconhecida ao inicializar Firebase Admin SDK.", error);
      } else {
         console.log("[users/actions] Firebase Admin SDK já inicializado por uma chamada anterior.");
         adminInitialized = true; 
      }
    }
  } else {
    console.log("[users/actions] Firebase Admin SDK já inicializado.");
    adminInitialized = true;
  }

  if (adminInitialized) {
    try {
        dbAdmin = admin.firestore();
        authAdmin = admin.auth();
        if (dbAdmin && authAdmin) {
          console.log("[users/actions] Firestore Admin DB e Auth Admin instances obtidas com sucesso. Projeto ID:", dbAdmin.projectId);
        } else {
          console.error("[users/actions] CRÍTICO: admin.firestore() ou admin.auth() retornou null/undefined após init do SDK.");
          adminInitialized = false; 
        }
    } catch (e: any) {
        console.error("[users/actions] CRÍTICO: Falha ao obter Firestore Admin DB ou Auth Admin instance:", e.message);
        adminInitialized = false;
    }
  }
  
  if (!adminInitialized || !dbAdmin || !authAdmin) {
    console.error("[users/actions] ALERTA: Firebase Admin SDK, Firestore Admin DB ou Auth Admin não pôde ser inicializado em users/actions.ts. Operações que dependem do Admin SDK podem não funcionar como esperado.");
  }
}

initializeAdminSDK();
// --- Fim da Inicialização do Firebase Admin SDK ---

function safeConvertToDate(timestampField: any): Date | null {
  if (!timestampField) return null;
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
  console.warn(`[users/actions] Could not convert timestamp to Date: ${JSON.stringify(timestampField)}. Returning null.`);
  return null;
}

export async function createUser(
  data: UserFormValues
): Promise<{ success: boolean; message: string; userId?: string }> {
  if (!firestoreClientDB || !authAdmin) { // Verifica authAdmin também
    const msg = 'Erro de configuração: Admin SDK não inicializado para criação de usuário.';
    console.error(`[createUser] ${msg}`);
    return { success: false, message: msg };
  }

  if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }
  // A senha é opcional no formulário, mas necessária para criar no Firebase Auth.
  // Por enquanto, esta action se concentrará em criar o perfil no Firestore.
  // A criação no Auth será um passo futuro ou gerenciada por convite.

  console.log(`[createUser] Tentando criar perfil no Firestore para: ${data.email}`);
  try {
    // Verificar se já existe um usuário com este email no Firestore para evitar duplicidade
    const usersRef = collection(firestoreClientDB, 'users');
    const q = query(usersRef, where('email', '==', data.email.trim().toLowerCase()), limit(1));
    const existingUserSnap = await getDocs(q);
    if (!existingUserSnap.empty) {
      console.warn(`[createUser] Usuário com email ${data.email} já existe no Firestore.`);
      return { success: false, message: `Usuário com email ${data.email} já existe.` };
    }

    let roleIdToAssign: string | undefined = undefined;
    let roleNameToAssign: string | undefined = 'USER'; // Default
    let permissionsToAssign: string[] = [];

    if (data.roleId && data.roleId !== "---NONE---") {
      const roleDoc = await getRole(data.roleId);
      if (roleDoc) {
        roleIdToAssign = roleDoc.id;
        roleNameToAssign = roleDoc.name;
        permissionsToAssign = roleDoc.permissions || [];
      } else {
        console.warn(`[createUser] Perfil com ID ${data.roleId} não encontrado. Usuário será criado sem perfil definido ou com perfil USER padrão.`);
        const userRole = await getRoleByName('USER');
        if (userRole) {
          roleIdToAssign = userRole.id;
          roleNameToAssign = userRole.name;
          permissionsToAssign = userRole.permissions || [];
        }
      }
    } else { // Nenhum perfil selecionado ou "---NONE---"
      const userRole = await getRoleByName('USER');
      if (userRole) {
        roleIdToAssign = userRole.id;
        roleNameToAssign = userRole.name;
        permissionsToAssign = userRole.permissions || [];
      } else {
        console.warn("[createUser] Perfil 'USER' padrão não encontrado. Usuário será criado sem permissões default.");
      }
    }
    
    // Simular criação de UID, já que não estamos criando no Auth SDK aqui
    // Em um cenário real com Admin SDK, o UID viria do Auth.
    const newUserId = `firestore_only_${Date.now()}`; 

    const newUserProfileData: Omit<UserProfileData, 'uid' | 'createdAt' | 'updatedAt'> & { uid: string, createdAt: FieldValue, updatedAt: FieldValue } = {
      uid: newUserId,
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      roleId: roleIdToAssign,
      roleName: roleNameToAssign,
      permissions: permissionsToAssign,
      status: 'ATIVO',
      habilitationStatus: 'PENDENTE_DOCUMENTOS',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Aqui usamos firestoreClientDB para criar o documento,
    // pois a criação de usuário no Auth (que daria o UID real) não está implementada nesta action.
    await setDoc(doc(firestoreClientDB, 'users', newUserId), newUserProfileData);

    console.log(`[createUser] Perfil para ${data.email} criado no Firestore com ID simulado: ${newUserId}`);
    revalidatePath('/admin/users');
    return { success: true, message: 'Perfil de usuário criado no Firestore com sucesso (Autenticação manual necessária).', userId: newUserId };

  } catch (error: any) {
    console.error(`[createUser] ERRO ao criar perfil para ${data.email} no Firestore:`, error.message, error.code);
    return { success: false, message: `Falha ao criar perfil de usuário no Firestore: ${error.message}` };
  }
}


export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  if (!firestoreClientDB) {
    console.error("[getUsersWithRoles] Firestore (cliente) DB não inicializado. Retornando array vazio.");
    return [];
  }
  console.log("[getUsersWithRoles] Iniciando busca de usuários...");
  try {
    const usersCollection = collection(firestoreClientDB, 'users');
    const q = query(usersCollection, orderBy('fullName', 'asc'));
    const snapshot = await getDocs(q);
    console.log(`[getUsersWithRoles] Encontrados ${snapshot.docs.length} documentos de usuários.`);

    const users = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let roleName: string | undefined = data.roleName; 
      let fetchedPermissions: string[] = data.permissions || [];

      if (data.roleId && !roleName) { 
        console.log(`[getUsersWithRoles] Usuário ${docSnap.id} tem roleId ${data.roleId}, buscando nome do perfil...`);
        const roleDoc = await getRole(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
          // Se as permissões do usuário estiverem vazias e o perfil tiver permissões, use as do perfil
          if (fetchedPermissions.length === 0 && roleDoc.permissions && roleDoc.permissions.length > 0) {
            fetchedPermissions = roleDoc.permissions;
             console.log(`[getUsersWithRoles] Usando permissões do perfil "${roleName}" para usuário ${docSnap.id}`);
          }
        } else {
          console.warn(`[getUsersWithRoles] Perfil com ID ${data.roleId} não encontrado para usuário ${docSnap.id}`);
        }
      } else if (!data.roleId && fetchedPermissions.length === 0) {
        // Se não há roleId nem permissões no documento do usuário, tenta atribuir permissões de USER como fallback
        console.log(`[getUsersWithRoles] Usuário ${docSnap.id} sem roleId e sem permissões. Tentando perfil USER padrão...`);
        const defaultUserRole = await getRoleByName('USER');
        if (defaultUserRole) {
          roleName = defaultUserRole.name;
          fetchedPermissions = defaultUserRole.permissions || [];
           console.log(`[getUsersWithRoles] Atribuindo perfil USER padrão para ${docSnap.id} no contexto da listagem.`);
        }
      }
      return {
        uid: docSnap.id,
        email: data.email,
        fullName: data.fullName,
        roleId: data.roleId,
        roleName: roleName || 'Não Definido',
        status: data.status || 'ATIVO',
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        permissions: fetchedPermissions,
        createdAt: safeConvertToDate(data.createdAt),
      } as UserProfileData;
    }));
    console.log(`[getUsersWithRoles] Mapeados ${users.length} usuários com perfis e permissões.`);
    return users;
  } catch (error: any) {
    console.error("[getUsersWithRoles] Erro ao buscar usuários:", error.message, error.code);
    if (error.details) {
        console.error("[getUsersWithRoles] Detalhes do erro:", error.details);
    }
    return [];
  }
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
   if (!firestoreClientDB) {
    console.error(`[getUserProfileData for UID ${userId}] Firestore (cliente) DB não inicializado. Retornando null.`);
    return null;
  }
  console.log(`[getUserProfileData] Buscando perfil para UID: ${userId}`);
  try {
    const userDocRef = doc(firestoreClientDB, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let roleName: string | undefined = data.roleName;
      let fetchedPermissions: string[] = data.permissions || [];

      if (data.roleId && !roleName) {
        const roleDoc = await getRole(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
          if (fetchedPermissions.length === 0 && roleDoc.permissions) {
            fetchedPermissions = roleDoc.permissions;
          }
        } else {
           console.warn(`[getUserProfileData] Perfil com ID ${data.roleId} não encontrada para usuário ${userId}`);
        }
      }
      console.log(`[getUserProfileData] Perfil encontrado para UID: ${userId}, RoleName: ${roleName}`);
      return {
        uid: docSnap.id,
        ...data,
        roleName: roleName || 'Não Definido',
        permissions: fetchedPermissions,
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
        dateOfBirth: safeConvertToDate(data.dateOfBirth),
        rgIssueDate: safeConvertToDate(data.rgIssueDate),
      } as UserProfileData;
    }
    console.log(`[getUserProfileData] Nenhum perfil encontrado para UID: ${userId}`);
    return null;
  } catch (error: any) {
    console.error(`[getUserProfileData] ERRO ao buscar perfil para UID ${userId}:`, error.message, error.code);
    return null;
  }
}


export async function updateUserRole( // Renomeado de updateUserProfileAndRole para ser mais específico
  userId: string,
  roleId: string | null // Agora só aceita roleId
): Promise<{ success: boolean; message: string }> {
  if (!firestoreClientDB) {
    const msg = 'Erro de configuração: Banco de dados (cliente) não inicializado para updateUserRole.';
    console.error(`[updateUserRole for UID ${userId}] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }
  console.log(`[updateUserRole] Tentando atualizar perfil do usuário ${userId} para roleId: ${roleId}`);

  try {
    const userDocRef = doc(firestoreClientDB, 'users', userId);
    const updateData: { roleId?: string | FieldValue; roleName?: string | FieldValue; permissions?: string[] | FieldValue; updatedAt: FieldValue, role?: FieldValue } = {
      updatedAt: serverTimestamp(),
    };

    if (roleId) {
        console.log(`[updateUserRole] Tentando definir roleId: ${roleId}`);
        const roleDoc = await getRole(roleId); // Usando getRole de roles/actions
        if (roleDoc) {
            console.log(`[updateUserRole] Perfil encontrado: ${roleDoc.name}`);
            updateData.roleId = roleId;
            updateData.roleName = roleDoc.name;
            updateData.permissions = roleDoc.permissions || [];
        } else {
            console.warn(`[updateUserRole] Perfil com ID ${roleId} não encontrado.`);
            return { success: false, message: 'Perfil (Role) não encontrado.'};
        }
    } else { 
        console.log(`[updateUserRole] Removendo roleId, roleName e permissions.`);
        updateData.roleId = FieldValue.delete(); 
        updateData.roleName = FieldValue.delete();
        updateData.permissions = FieldValue.delete();
        updateData.role = FieldValue.delete(); // Remove legacy field as well
    }
    
    console.log(`[updateUserRole] Payload para Firestore para usuário ${userId}:`, JSON.stringify(updateData));
    await updateDoc(userDocRef, updateData);
    console.log(`[updateUserRole] Usuário ${userId} atualizado com sucesso.`);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Perfil do usuário atualizado com sucesso!' };
  } catch (error: any)    {
    console.error("[updateUserRole] ERRO ao atualizar perfil do usuário:", error.message, error.code, error.details);
    return { success: false, message: `Falha ao atualizar perfil do usuário: ${error.message}` };
  }
}


export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  if (!adminInitialized || !dbAdmin || !authAdmin) {
    const msg = 'Erro de Configuração: Admin SDK não inicializado para exclusão de usuário.';
    console.error(`[deleteUser] ${msg}`);
    return { success: false, message: msg };
  }
  console.log(`[deleteUser] Tentando excluir usuário: ${userId}`);
  try {
    // Excluir do Firebase Authentication (Admin SDK)
    await authAdmin.deleteUser(userId);
    console.log(`[deleteUser] Usuário ${userId} excluído do Firebase Authentication.`);

    // Excluir do Firestore
    const userDocRef = doc(dbAdmin, 'users', userId); // Usar dbAdmin
    await deleteFirestoreDoc(userDocRef); 
    console.log(`[deleteUser] Documento do usuário ${userId} excluído do Firestore.`);

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário excluído com sucesso do Auth e Firestore!' };
  } catch (error: any) {
    console.error("[deleteUser] ERRO ao excluir usuário:", error);
    let clientMessage = 'Falha ao excluir usuário.';
    if (error.code === 'auth/user-not-found') {
        clientMessage = "Usuário não encontrado no Firebase Authentication. O registro no Firestore (se existir) será removido.";
        // Tentar excluir apenas do Firestore se não existir no Auth
        try {
            const userDocRef = doc(dbAdmin, 'users', userId);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                await deleteFirestoreDoc(userDocRef);
                revalidatePath('/admin/users');
                return { success: true, message: "Usuário não encontrado no Auth, mas removido do Firestore." };
            } else {
                return { success: false, message: "Usuário não encontrado no Auth nem no Firestore." };
            }
        } catch (fsError: any) {
            console.error("[deleteUser] ERRO ao excluir do Firestore após falha no Auth:", fsError);
            return { success: false, message: `Falha ao excluir do Firestore: ${fsError.message}` };
        }
    } else if (error.message) {
        clientMessage = error.message;
    }
    return { success: false, message: clientMessage };
  }
}

export async function ensureUserRoleInFirestore(
  userId: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData}> {
  if (!firestoreClientDB) { // Usa o SDK cliente para ler/escrever o perfil do usuário durante o login
    const msg = 'Erro de configuração: Banco de dados (cliente) não inicializado em ensureUserRoleInFirestore.';
    console.error(`[ensureUserRoleInFirestore for ${email}] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId || !email) {
    console.error(`[ensureUserRoleInFirestore] Chamada inválida: userId ou email ausentes.`);
    return { success: false, message: 'UID do usuário e email são obrigatórios.' };
  }
  console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Iniciando...`);

  try {
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 1: Garantindo perfis padrão...`);
    const rolesEnsured = await ensureDefaultRolesExist(); 
    
    if (!rolesEnsured || !rolesEnsured.success) {
      const errorMsg = `Falha crítica ao garantir perfis padrão: ${rolesEnsured?.message || 'Resultado indefinido de ensureDefaultRolesExist'}`;
      console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] ${errorMsg}`);
      return { success: false, message: errorMsg };
    }
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 1.1: Perfis padrão verificados/criados. Success: ${rolesEnsured?.success}, Message: ${rolesEnsured?.message}`);
    
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 2: Buscando o perfil "${targetRoleName}"...`);
    const targetRole = await getRoleByName(targetRoleName);
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Perfil "${targetRoleName}" NÃO encontrado após ensureDefaultRolesExist.`);
      return { success: false, message: `Perfil "${targetRoleName}" não pôde ser encontrado ou criado.` };
    }
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 2.1: Perfil "${targetRoleName}" encontrado com ID: ${targetRole.id}, Permissões: ${targetRole.permissions?.join(', ')}`);

    const userDocRef = doc(firestoreClientDB, 'users', userId);
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3: Buscando documento do usuário ${userId}...`);
    const userSnap = await getDoc(userDocRef);
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] UserSnap exists: ${userSnap.exists()}`);


    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfileData;
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3.1: Documento do usuário encontrado. RoleId atual: ${userData.roleId}, RoleName: ${userData.roleName}, Habilitation: ${userData.habilitationStatus}`);
      
      const updatePayload: Partial<UserProfileData & { role?: FieldValue }> = { updatedAt: serverTimestamp() as Timestamp };
      let needsUpdate = false;

      if (userData.roleId !== targetRole.id) {
        updatePayload.roleId = targetRole.id;
        needsUpdate = true;
      }
      if (userData.roleName !== targetRole.name) {
        updatePayload.roleName = targetRole.name;
        needsUpdate = true;
      }
       if (!userData.permissions || JSON.stringify((userData.permissions || []).sort()) !== JSON.stringify((targetRole.permissions || []).sort())) {
        updatePayload.permissions = targetRole.permissions || [];
        needsUpdate = true;
      }
      
      const expectedHabilitation = targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : (userData.habilitationStatus || 'PENDENTE_DOCUMENTOS');
      if (userData.habilitationStatus !== expectedHabilitation) {
        updatePayload.habilitationStatus = expectedHabilitation;
        needsUpdate = true;
      }
      
      if (userData.hasOwnProperty('role')) {
        updatePayload.role = FieldValue.delete(); 
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 4: Atualizando perfil/habilitação do usuário... Payload:`, JSON.stringify(updatePayload));
        await updateDoc(userDocRef, updatePayload as any); 
        console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 4.1: Perfil/habilitação do usuário atualizado.`);
        const updatedProfile = await getUserProfileData(userId); 
        return { success: true, message: 'Perfil do usuário atualizado.', userProfile: updatedProfile || undefined };
      }
      
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Usuário já possui o perfil correto e está habilitado (se admin). Nenhuma alteração necessária.`);
      return { success: true, message: 'Perfil do usuário já está correto.', userProfile: userData };
    } else {
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3.1: Documento do usuário não encontrado. Criando...`);
      const newUserProfile: UserProfileData = {
        uid: userId,
        email: email!,
        fullName: fullName || email!.split('@')[0],
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'ATIVO',
        habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
        permissions: targetRole.permissions || [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Tentando criar documento do usuário com dados:`, JSON.stringify(newUserProfile));
      await setDoc(userDocRef, newUserProfile);
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Perfil de usuário criado.`);
      const createdProfile = await getUserProfileData(userId);
      return { success: true, message: 'Perfil de usuário criado e perfil atribuído.', userProfile: createdProfile || undefined };
    }
  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Error:`, error.message, error.code, error.details ? JSON.stringify(error.details) : '');
    if (error.message && (error.message.includes('Missing or insufficient permissions') || error.code === 7 || error.code === 'permission-denied')) {
        return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: Permissões insuficientes para operação no Firestore. Regras do cliente Firestore podem estar bloqueando. Verifique as regras para /users/{userId}.` };
    }
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'>; // Para a action do Firestore
    

    