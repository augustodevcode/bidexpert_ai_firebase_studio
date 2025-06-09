
'use server';

import { revalidatePath } from 'next/cache';
import { 
  ensureAdminInitialized, 
  FieldValue as AdminFieldValue, 
  Timestamp as ServerTimestamp 
} from '@/lib/firebase/admin'; 
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName as getRoleByNameAdmin, ensureDefaultRolesExist as ensureDefaultRolesExistAdmin, getRole as getRoleAdmin } from '@/app/admin/roles/actions';
import type { UserFormValues } from './user-form-schema';

function safeConvertToDate(timestampField: any): Date | null {
  if (!timestampField) return null;
  if (timestampField instanceof ServerTimestamp || timestampField instanceof (global as any).FirebaseFirestore?.Timestamp) { 
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') { 
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new ServerTimestamp(timestampField.seconds, timestampField.nanoseconds).toDate();
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
  const { dbAdmin: currentDbAdmin, authAdmin: currentAuthAdmin, error: sdkError } = ensureAdminInitialized();
  if (sdkError || !currentDbAdmin || !currentAuthAdmin) {
    const msg = `Erro de configuração: Admin SDK Firestore/Auth não disponível para createUser. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[createUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }

  if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }
  console.log(`[createUser - Admin SDK] Dados recebidos:`, JSON.stringify(data));
  
  try {
    let existingAuthUser;
    try {
      existingAuthUser = await currentAuthAdmin.getUserByEmail(data.email.trim().toLowerCase());
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error; 
      }
    }

    if (existingAuthUser) {
      console.warn(`[createUser - Admin SDK] Usuário com email ${data.email} já existe no Firebase Auth (UID: ${existingAuthUser.uid}). Verificando Firestore...`);
      const existingFirestoreUserDoc = await currentDbAdmin.collection('users').doc(existingAuthUser.uid).get();
      if (existingFirestoreUserDoc.exists) {
        return { success: false, message: `Usuário com email ${data.email} já existe no sistema (Auth e Firestore).` };
      }
      return { success: false, message: `Usuário com email ${data.email} já existe no Firebase Auth, mas não no Firestore. Sincronização manual pode ser necessária.` };
    }
    
    console.log(`[createUser - Admin SDK] Usuário com email ${data.email} não encontrado no Auth. Tentando criar...`);
    const userRecord = await currentAuthAdmin.createUser({
      email: data.email.trim().toLowerCase(),
      emailVerified: false, 
      password: data.password || undefined, 
      displayName: data.fullName.trim(),
      disabled: false,
    });
    console.log(`[createUser - Admin SDK] Usuário criado no Firebase Auth com UID: ${userRecord.uid}`);

    let roleIdToAssign: string | undefined = undefined;
    let roleNameToAssign: string | undefined = 'USER';
    let permissionsToAssign: string[] = [];

    if (data.roleId && data.roleId !== "---NONE---") {
      const roleDoc = await getRoleAdmin(data.roleId); 
      if (roleDoc) {
        roleIdToAssign = roleDoc.id;
        roleNameToAssign = roleDoc.name;
        permissionsToAssign = roleDoc.permissions || [];
      } else {
        console.warn(`[createUser - Admin SDK] Perfil com ID ${data.roleId} não encontrado. Atribuindo perfil USER padrão.`);
        const userRole = await getRoleByNameAdmin('USER'); 
        if (userRole) {
          roleIdToAssign = userRole.id;
          roleNameToAssign = userRole.name;
          permissionsToAssign = userRole.permissions || [];
        }
      }
    } else {
      const userRole = await getRoleByNameAdmin('USER');
      if (userRole) {
        roleIdToAssign = userRole.id;
        roleNameToAssign = userRole.name;
        permissionsToAssign = userRole.permissions || [];
      } else {
        console.warn("[createUser - Admin SDK] Perfil 'USER' padrão não encontrado.");
      }
    }
    console.log(`[createUser - Admin SDK] Perfil a ser atribuído: ID=${roleIdToAssign}, Nome=${roleNameToAssign}`);

    const newUserProfileData: Omit<UserProfileData, 'uid'> & { uid: string, createdAt: admin.firestore.FieldValue, updatedAt: admin.firestore.FieldValue } = {
      uid: userRecord.uid,
      email: userRecord.email!,
      fullName: userRecord.displayName!,
      roleId: roleIdToAssign,
      roleName: roleNameToAssign,
      permissions: permissionsToAssign,
      status: 'ATIVO',
      habilitationStatus: 'PENDENTE_DOCUMENTOS',
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    };
    
    console.log(`[createUser - Admin SDK] Payload para Firestore para novo usuário ${userRecord.uid}:`, JSON.stringify(newUserProfileData));
    await currentDbAdmin.collection('users').doc(userRecord.uid).set(newUserProfileData);

    console.log(`[createUser - Admin SDK] Perfil para ${data.email} criado no Firestore com UID: ${userRecord.uid}`);
    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso no Auth e Firestore.', userId: userRecord.uid };

  } catch (error: any) {
    console.error(`[createUser - Admin SDK] ERRO ao criar usuário ${data.email}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao criar usuário: ${error.message}` };
  }
}


export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
      console.warn("[getUsersWithRoles - Admin SDK] Admin SDK Firestore não disponível. Retornando array vazio.");
      return [];
  }
  console.log("[getUsersWithRoles - Admin SDK] Iniciando busca de usuários...");
  try {
    const usersCollection = currentDbAdmin.collection('users');
    const q = usersCollection.orderBy('fullName', 'asc');
    const snapshot = await q.get();
    console.log(`[getUsersWithRoles - Admin SDK] Encontrados ${snapshot.docs.length} documentos de usuários.`);

    const users = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let roleName: string | undefined = data.roleName;
      let fetchedPermissions: string[] = data.permissions || [];

      if (data.roleId && !roleName) {
        const roleDoc = await getRoleAdmin(data.roleId); 
        if (roleDoc) {
          roleName = roleDoc.name;
          if ((!fetchedPermissions || fetchedPermissions.length === 0) && roleDoc.permissions) {
            fetchedPermissions = roleDoc.permissions;
          }
        } else {
          console.warn(`[getUsersWithRoles - Admin SDK] Perfil com ID ${data.roleId} não encontrado para usuário ${docSnap.id}`);
        }
      } else if (!data.roleId && (!fetchedPermissions || fetchedPermissions.length === 0)) {
          const defaultUserRole = await getRoleByNameAdmin('USER');
          if (defaultUserRole) {
            roleName = defaultUserRole.name;
            fetchedPermissions = defaultUserRole.permissions || [];
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
    console.log(`[getUsersWithRoles - Admin SDK] Mapeados ${users.length} usuários com perfis e permissões.`);
    return users;
  } catch (error: any) {
    console.error("[getUsersWithRoles - Admin SDK] Erro ao buscar usuários:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
   const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
   if (sdkError || !currentDbAdmin) {
    console.warn(`[getUserProfileData for UID ${userId} - Admin SDK] Admin SDK Firestore não disponível. Retornando null.`);
    return null;
  }
  console.log(`[getUserProfileData - Admin SDK] Buscando perfil para UID: ${userId}`);
  try {
    const userDocRef = currentDbAdmin.collection('users').doc(userId);
    const docSnap = await userDocRef.get();
    if (docSnap.exists()) {
      const data = docSnap.data()!; // data() is guaranteed to exist if docSnap.exists()
      let roleName: string | undefined = data.roleName;
      let fetchedPermissions: string[] = data.permissions || [];

      if (data.roleId && !roleName) {
        const roleDoc = await getRoleAdmin(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
          if ((!fetchedPermissions || fetchedPermissions.length === 0) && roleDoc.permissions) {
            fetchedPermissions = roleDoc.permissions;
          }
        } else {
           console.warn(`[getUserProfileData - Admin SDK] Perfil com ID ${data.roleId} não encontrada para usuário ${userId}`);
        }
      }
      console.log(`[getUserProfileData - Admin SDK] Perfil encontrado para UID: ${userId}, RoleName: ${roleName}`);
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
    console.log(`[getUserProfileData - Admin SDK] Nenhum perfil encontrado para UID: ${userId}`);
    return null;
  } catch (error: any) {
    console.error(`[getUserProfileData - Admin SDK] ERRO ao buscar perfil para UID ${userId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    const msg = `Erro de configuração: Admin SDK Firestore não disponível para updateUserRole. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[updateUserRole for UID ${userId} - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }
  console.log(`[updateUserRole - Admin SDK] Tentando atualizar perfil do usuário ${userId} para roleId: ${roleId}`);

  try {
    const userDocRef = currentDbAdmin.collection('users').doc(userId);
    const updateData: { [key: string]: any } = { 
      updatedAt: AdminFieldValue.serverTimestamp(),
    };

    if (roleId && roleId !== "---NONE---") {
        console.log(`[updateUserRole - Admin SDK] Tentando definir roleId: ${roleId}`);
        const roleDoc = await getRoleAdmin(roleId); 
        if (roleDoc) {
            console.log(`[updateUserRole - Admin SDK] Perfil encontrado: ${roleDoc.name}`);
            updateData.roleId = roleId;
            updateData.roleName = roleDoc.name;
            updateData.permissions = roleDoc.permissions || [];
            updateData.role = AdminFieldValue.delete(); 
        } else {
            console.warn(`[updateUserRole - Admin SDK] Perfil com ID ${roleId} não encontrado.`);
            return { success: false, message: 'Perfil (Role) não encontrado.'};
        }
    } else {
        console.log(`[updateUserRole - Admin SDK] Removendo roleId, roleName e permissions.`);
        updateData.roleId = AdminFieldValue.delete();
        updateData.roleName = AdminFieldValue.delete();
        updateData.permissions = AdminFieldValue.delete();
        updateData.role = AdminFieldValue.delete();
    }

    console.log(`[updateUserRole - Admin SDK] Payload para Firestore para usuário ${userId}:`, JSON.stringify(updateData));
    await userDocRef.update(updateData);
    console.log(`[updateUserRole - Admin SDK] Usuário ${userId} atualizado com sucesso.`);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Perfil do usuário atualizado com sucesso!' };
  } catch (error: any)    {
    console.error("[updateUserRole - Admin SDK] ERRO ao atualizar perfil do usuário:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao atualizar perfil do usuário: ${error.message}` };
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, authAdmin: currentAuthAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin || !currentAuthAdmin) {
    const msg = `Erro de Configuração: Admin SDK não inicializado para exclusão de usuário. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[deleteUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }
  console.log(`[deleteUser - Admin SDK] Tentando excluir usuário: ${userId}`);
  try {
    try {
      await currentAuthAdmin.deleteUser(userId);
      console.log(`[deleteUser - Admin SDK] Usuário ${userId} excluído do Firebase Authentication.`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.warn(`[deleteUser - Admin SDK] Usuário ${userId} não encontrado no Firebase Authentication. Prosseguindo com exclusão do Firestore.`);
      } else {
        throw authError; 
      }
    }

    const userDocRef = currentDbAdmin.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
        await userDocRef.delete();
        console.log(`[deleteUser - Admin SDK] Documento do usuário ${userId} excluído do Firestore.`);
    } else {
        console.warn(`[deleteUser - Admin SDK] Documento do usuário ${userId} não encontrado no Firestore, mas pode ter sido removido do Auth (se existia).`);
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Operação de exclusão de usuário concluída.' };
  } catch (error: any) {
    console.error("[deleteUser - Admin SDK] ERRO ao excluir usuário:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}

export async function ensureUserRoleInFirestore(
  userUid: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
  console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Received userUid: ${userUid}`);

  const { dbAdmin: currentDbAdmin, error: sdkError } = ensureAdminInitialized(); // Note: ensureAdminInitialized is now synchronous
  if (sdkError || !currentDbAdmin) {
    const msg = `Erro de config: Admin SDK Firestore não disponível para ensureUserRoleInFirestore. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] ${msg}`);
    return { success: false, message: msg };
  }

  if (!userUid || !email) {
    console.error(`[ensureUserRoleInFirestore - Admin SDK] Chamada inválida: userUid ou email ausentes.`);
    return { success: false, message: 'UID do usuário e email são obrigatórios.' };
  }
  console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Iniciando...`);

  try {
    await ensureDefaultRolesExistAdmin(); // Uses Admin SDK internally

    const targetRole = await getRoleByNameAdmin(targetRoleName); // Uses Admin SDK internally
    
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil "${targetRoleName}" NÃO encontrado.`);
      const userRoleFallback = await getRoleByNameAdmin('USER'); // Uses Admin SDK internally
      if (userRoleFallback) {
        console.warn(`[ensureUserRoleInFirestore - Admin SDK for ${email}] Perfil "${targetRoleName}" não encontrado, usando USER como fallback.`);
        Object.assign(targetRole || {}, userRoleFallback); // targetRole might still be null, be careful
      } else {
        console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}] Perfil "USER" padrão também não encontrado. Não é possível atribuir perfil.`);
        return { success: false, message: `Perfil "${targetRoleName}" ou "USER" não pôde ser encontrado.` };
      }
    }
    // At this point, targetRole should be populated, either with the targetRoleName or 'USER' if fallback succeeded.
    // If targetRole is still null here, it means even 'USER' role wasn't found, which is a critical setup issue.
    if (!targetRole) {
        const criticalErrorMsg = `Falha crítica: Nem o perfil "${targetRoleName}" nem o perfil "USER" padrão foram encontrados. Verifique a configuração dos perfis.`;
        console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}] ${criticalErrorMsg}`);
        return { success: false, message: criticalErrorMsg };
    }


    const userDocRef = currentDbAdmin.collection('users').doc(userUid); 
    const userSnap = await userDocRef.get();

    let finalProfileData: UserProfileData | undefined = undefined;
    
    if (userSnap.exists) {
      const userDataFromDB = userSnap.data() as UserProfileData;
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Documento do usuário encontrado. RoleId: ${userDataFromDB.roleId}, RoleName: ${userDataFromDB.roleName}`);
      
      const updatePayload: { [key:string]: any } = { updatedAt: AdminFieldValue.serverTimestamp() };
      let needsUpdate = false;

      if (userDataFromDB.roleId !== targetRole.id) {
        updatePayload.roleId = targetRole.id;
        needsUpdate = true;
      }
      if (userDataFromDB.roleName !== targetRole.name) {
        updatePayload.roleName = targetRole.name;
        needsUpdate = true;
      }
      
      const currentPermissionsSorted = [...(userDataFromDB.permissions || [])].sort();
      const targetPermissionsSorted = [...(targetRole.permissions || [])].sort();
      if (JSON.stringify(currentPermissionsSorted) !== JSON.stringify(targetPermissionsSorted)) {
        updatePayload.permissions = targetRole.permissions || [];
        needsUpdate = true;
      }

      if (targetRoleName === 'ADMINISTRATOR' && userDataFromDB.habilitationStatus !== 'HABILITADO') {
        updatePayload.habilitationStatus = 'HABILITADO';
        needsUpdate = true;
      }
       if (userDataFromDB.email !== email) {
        updatePayload.email = email;
        needsUpdate = true;
      }
      if (fullName && fullName !== userDataFromDB.fullName) {
        updatePayload.fullName = fullName;
        needsUpdate = true;
      }

      if (userDataFromDB.hasOwnProperty('role')) {
          updatePayload.role = AdminFieldValue.delete();
          needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Atualizando perfil do usuário... Payload:`, JSON.stringify(updatePayload));
        await userDocRef.update(updatePayload);
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil do usuário atualizado.`);
      }
      const updatedSnap = await userDocRef.get(); 
      const updatedData = updatedSnap.data()!;
        finalProfileData = { 
          uid: updatedSnap.id, ...updatedData,
          createdAt: safeConvertToDate(updatedData.createdAt),
          updatedAt: safeConvertToDate(updatedData.updatedAt),
          dateOfBirth: safeConvertToDate(updatedData.dateOfBirth),
          rgIssueDate: safeConvertToDate(updatedData.rgIssueDate),
      } as UserProfileData;

    } else {
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Documento do usuário não encontrado. Criando...`);
      const newUserProfileForFirestore: Omit<UserProfileData, 'uid' | 'createdAt' | 'updatedAt'> & { uid: string, createdAt: admin.firestore.FieldValue, updatedAt: admin.firestore.FieldValue } = {
        uid: userUid,
        email: email!,
        fullName: fullName || email!.split('@')[0],
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'ATIVO',
        habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
        permissions: targetRole.permissions || [],
        createdAt: AdminFieldValue.serverTimestamp(),
        updatedAt: AdminFieldValue.serverTimestamp(),
      };
      await userDocRef.set(newUserProfileForFirestore);
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil de usuário criado.`);
      const createdSnap = await userDocRef.get();
      const createdData = createdSnap.data()!;
        finalProfileData = { 
          uid: createdSnap.id, ...createdData,
          createdAt: safeConvertToDate(createdData.createdAt),
          updatedAt: safeConvertToDate(createdData.updatedAt),
        } as UserProfileData;
    }
    return { success: true, message: 'Perfil do usuário verificado/atualizado.', userProfile: finalProfileData };

  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'>;
