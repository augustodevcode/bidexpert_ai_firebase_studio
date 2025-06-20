
// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { sampleUserProfiles, sampleRoles, slugify } from '@/lib/sample-data';
import type { UserProfileData, Role, UserHabilitationStatus, UserProfileWithPermissions } from '@/types';
import type { UserFormValues } from './user-form-schema';
import { v4 as uuidv4 } from 'uuid';
import { getRoleInternal, getRoleByNameInternal, ensureDefaultRolesExistInternal } from '../roles/queries';

const ADMIN_SUPER_EMAIL = 'admin@bidexpert.com.br';

console.log('[Users Actions] Using sampleUserProfiles and sampleRoles data sources.');

export interface UserCreationData {
  fullName: string;
  email: string;
  password?: string;
  roleId?: string | null;
  cpf?: string;
  cellPhone?: string;
  dateOfBirth?: Date | null;
  accountType?: 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
  razaoSocial?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  websiteComitente?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  optInMarketing?: boolean;
}

export async function createUser(
  data: UserCreationData
): Promise<{ success: boolean; message: string; userId?: string }> {
  console.log(`[createUser Action - SampleData Mode] Simulating creation for: ${data.email}`);
  // In sample data mode, we don't actually modify the sampleUserProfiles array.
  // We just simulate a successful creation.
  const existingUser = sampleUserProfiles.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
  if (existingUser) {
    return { success: false, message: `Usuário com email ${data.email} já existe nos dados de exemplo.` };
  }
  revalidatePath('/admin/users');
  return { success: true, message: 'Usuário (simulado) criado com sucesso.', userId: `sample-user-${uuidv4()}` };
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  console.log('[getUsersWithRoles - SampleData Mode] Fetching from sampleUserProfiles.');
  // Enrich with roleName and permissions from sampleRoles
  const usersWithFullRoleInfo = sampleUserProfiles.map(user => {
    const role = sampleRoles.find(r => r.id === user.roleId);
    return {
      ...user,
      roleName: role?.name || 'Não Definido',
      permissions: role?.permissions || []
    };
  });
  return Promise.resolve(JSON.parse(JSON.stringify(usersWithFullRoleInfo)));
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  console.log(`[getUserProfileData - SampleData Mode] Fetching user ID: ${userId} from sampleUserProfiles.`);
  const user = sampleUserProfiles.find(u => u.uid === userId);
  if (user) {
    const role = sampleRoles.find(r => r.id === user.roleId);
    return Promise.resolve(JSON.parse(JSON.stringify({
      ...user,
      roleName: role?.name || 'Não Definido',
      permissions: role?.permissions || []
    })));
  }
  return Promise.resolve(null);
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  console.log(`[updateUserRole - SampleData Mode] Simulating update for user: ${userId}, new roleId: ${roleId}`);
  // Simulate success
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}/edit`);
  return { success: true, message: 'Perfil do usuário (simulado) atualizado!' };
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  console.log(`[deleteUser - SampleData Mode] Simulating deletion for user: ${userId}`);
  // Simulate success
  revalidatePath('/admin/users');
  return { success: true, message: 'Usuário (simulado) excluído!' };
}

export async function ensureUserProfileInDb(
  userUid: string,
  email: string | null,
  fullName: string | null,
  targetRoleNameInput: string,
  additionalProfileData?: Partial<UserProfileData & {password?: string}>,
  roleIdToAssign?: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions }> {
  console.log(`[ensureUserProfileInDb - SampleData Mode] Called for ${email}. Target role: ${targetRoleNameInput}, Role ID: ${roleIdToAssign}`);
  
  const existingProfile = sampleUserProfiles.find(p => p.uid === userUid || (email && p.email.toLowerCase() === email.toLowerCase()));

  if (existingProfile) {
    console.log(`[ensureUserProfileInDb - SampleData Mode] Found existing profile for ${email || userUid}.`);
    const role = sampleRoles.find(r => r.id === existingProfile.roleId);
    const profileWithFullRole = {
      ...existingProfile,
      roleName: role?.name || 'Não Definido',
      permissions: role?.permissions || [],
    };
    // Special handling for admin@bidexpert.com.br to ensure it ALWAYS gets admin role
    if (email && email.toLowerCase() === ADMIN_SUPER_EMAIL.toLowerCase()) {
      const adminRole = sampleRoles.find(r => r.name_normalized === 'ADMINISTRATOR');
      if (adminRole) {
        profileWithFullRole.roleId = adminRole.id;
        profileWithFullRole.roleName = adminRole.name;
        profileWithFullRole.permissions = adminRole.permissions;
        console.log(`[ensureUserProfileInDb - SampleData Mode] Ensured admin role for ${ADMIN_SUPER_EMAIL}.`);
      }
    }
    return { success: true, message: 'Perfil de usuário encontrado (SampleData).', userProfile: profileWithFullRole as UserProfileWithPermissions };
  }

  // If user not in sampleUserProfiles (e.g., new Firebase Auth user), simulate creation for context
  console.log(`[ensureUserProfileInDb - SampleData Mode] User ${email} not in sample data. Simulating profile creation.`);
  let targetRole: Role | null = null;
  if (email && email.toLowerCase() === ADMIN_SUPER_EMAIL.toLowerCase()) {
    targetRole = sampleRoles.find(r => r.name_normalized === 'ADMINISTRATOR') || null;
    console.log(`[ensureUserProfileInDb - SampleData Mode] New admin user ${ADMIN_SUPER_EMAIL}. Target role: ADMINISTRATOR`);
  } else if (roleIdToAssign && roleIdToAssign !== "---NONE---") {
    targetRole = sampleRoles.find(r => r.id === roleIdToAssign) || null;
  }
  if (!targetRole) {
    targetRole = sampleRoles.find(r => r.name_normalized === targetRoleNameInput.toUpperCase()) || sampleRoles.find(r => r.name_normalized === 'USER') || null;
  }

  if (!targetRole) {
    return { success: false, message: 'Perfil padrão USER não encontrado nos dados de exemplo.' };
  }

  const simulatedNewProfile: UserProfileWithPermissions = {
    uid: userUid,
    email: email || `generated-${userUid}@example.com`,
    fullName: fullName || email?.split('@')[0] || 'Novo Usuário',
    roleId: targetRole.id,
    roleName: targetRole.name,
    permissions: targetRole.permissions,
    status: 'ATIVO',
    habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...additionalProfileData,
  };
  console.log(`[ensureUserProfileInDb - SampleData Mode] Simulated new profile for ${email}:`, simulatedNewProfile);
  return { success: true, message: 'Perfil de usuário simulado criado (SampleData).', userProfile: simulatedNewProfile };
}

export async function getUserByEmail(email: string): Promise<UserProfileData | null> {
  console.log(`[getUserByEmail - SampleData Mode] Fetching email: ${email} from sampleUserProfiles.`);
  const user = sampleUserProfiles.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    const role = sampleRoles.find(r => r.id === user.roleId);
    const profileWithPassword = { // Ensure password is part of the structure if expected by calling functions
        ...user,
        password: user.password || 'sampleDataPasswordPlaceholder', // Add placeholder if not present
        roleName: role?.name || 'Não Definido',
        permissions: role?.permissions || [],
    };
    return Promise.resolve(JSON.parse(JSON.stringify(profileWithPassword)));
  }
  return Promise.resolve(null);
}

export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };
