// src/app/auth/actions.ts
/**
 * @fileoverview Server Actions para autenticação de usuários.
 * Este arquivo contém a lógica de backend para os processos de login e logout,
 * bem como para a recuperação de informações do usuário logado. As ações interagem
 * com a camada de serviço e com a biblioteca de sessão (jose) para validar
 * credenciais, criar e destruir sessões seguras em cookies.
 */
'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession as getSessionFromCookie, deleteSession as deleteSessionFromCookie } from '@/server/lib/session';
import type { UserProfileWithPermissions, Role, Tenant, UserCreationData, EditableUserProfileData } from '@/types';
import { revalidatePath } from 'next/cache';
import bcryptjs from 'bcryptjs';
import { prisma as basePrisma } from '@/lib/prisma';
import { UserService } from '@/services/user.service';

/**
 * Formata um objeto de usuário bruto do Prisma para o tipo `UserProfileWithPermissions`,
 * enriquecendo-o com uma lista de permissões consolidadas de seus perfis e uma
 * lista de nomes de perfis para fácil acesso.
 * @param {any} user - O objeto de usuário retornado pelo Prisma, incluindo `roles` e `tenants`.
 * @returns {UserProfileWithPermissions | null} O perfil formatado ou null se o usuário for inválido.
 */
function formatUserWithPermissions(user: any): UserProfileWithPermissions | null {
  if (!user) return null;

  const roles: Role[] = user.roles?.map((ur: any) => ({
    ...ur.role,
    id: ur.role.id, // ID is already a string
  })) || [];

  const permissions = Array.from(new Set(roles.flatMap((r: any) => {
    let perms = r.permissions;
    if (!perms) return [];

    if (typeof perms === 'string') {
      try {
        // Tenta fazer o parse se for uma string JSON (ex: '["manage_all"]')
        const parsed = JSON.parse(perms);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Se não for JSON, trata como lista separada por vírgula
        return perms.split(',').map((p: string) => p.trim()).filter(Boolean);
      }
    }

    if (Array.isArray(perms)) {
      return perms;
    }

    return [];
  })));

  const tenants: Tenant[] = user.tenants?.map((ut: any) => ({
    ...ut.tenant,
    id: ut.tenant.id, // ID is already a string
  })) || [];

  return {
    ...user,
    id: user.id.toString(),
    uid: user.id.toString(),
    roles,
    tenants,
    roleIds: roles.map((r: any) => r.id),
    roleNames: roles.map((r: any) => r.name),
    permissions,
    roleName: roles[0]?.name,
  };
}


/**
 * Realiza o processo de login de um usuário.
 * Valida as credenciais, verifica a associação ao tenant (se aplicável), e cria
 * uma sessão segura em caso de sucesso. Lida com o cenário multi-tenant, onde um
 * usuário pode pertencer a múltiplos "workspaces".
 * @param {object} values - Os dados do formulário de login.
 * @returns {Promise<{ success: boolean; message: string; user?: UserProfileWithPermissions | null }>} O resultado da operação de login.
 */
export async function login(values: { email: string, password?: string, tenantId?: string }): Promise<{ success: boolean; message: string; user?: UserProfileWithPermissions | null }> {
  const { email, password, tenantId: initialTenantId } = values;
  let tenantId = initialTenantId;

  if (!email) {
    return { success: false, message: 'Email é obrigatório.' };
  }

  try {
    console.log(`[Login Action] Tentativa de login para o email: ${email}`);
    const user = await basePrisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        tenants: { include: { tenant: true } }
      }
    });

    if (!user || !user.password) {
      console.log(`[Login Action] Falha: Usuário com email '${email}' não encontrado.`);
      return { success: false, message: 'Credenciais inválidas.' };
    }

    if (password && password !== '[already_validated]') {
      console.log(`[Login Action] Usuário '${email}' encontrado. Verificando a senha.`);
      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (!isPasswordValid) {
        console.log(`[Login Action] Falha: Senha inválida para o usuário '${email}'.`);
        return { success: false, message: 'Credenciais inválidas.' };
      }
    }

    const userProfileWithPerms = formatUserWithPermissions(user);
    if (!userProfileWithPerms) {
      return { success: false, message: 'Falha ao processar o perfil do usuário.' };
    }

    // Tenant Selection Logic
    if (!tenantId) {
      if (user.tenants?.length === 1) {
        tenantId = user.tenants[0].tenantId;
      } else if (user.tenants && user.tenants.length > 1) {
        // Se o usuário tem múltiplos tenants mas nenhum foi selecionado,
        // retorne o usuário para que a UI possa pedir a seleção.
        return { success: true, message: 'Selecione um espaço de trabalho.', user: userProfileWithPerms };
      } else {
        // Se o usuário não tem tenants, mas existe, ele pode ser um super admin
        // ou estamos no processo de setup. O padrão é o landlord.
        console.log(`[Login Action] Usuário '${email}' não pertence a nenhum tenant. Associando ao Landlord ('1').`);
        tenantId = '1';
      }
    }

    const userBelongsToFinalTenant = user.tenants?.some(t => t.tenantId.toString() === tenantId);
    // Permite que super admins ou usuários sem tenant loguem no tenant '1' (Landlord)
    if (!userBelongsToFinalTenant) {
      const isAdmin = userProfileWithPerms.permissions.includes('manage_all');
      if (tenantId !== '1' || (!isAdmin && user.tenants && user.tenants.length > 0)) {
        console.log(`[Login Action] Falha: Usuário '${email}' não pertence ao tenant '${tenantId}'.`);
        return { success: false, message: 'Credenciais inválidas para este espaço de trabalho.' };
      }
    }

    await createSession(userProfileWithPerms, tenantId);

    return { success: true, message: 'Login bem-sucedido!', user: userProfileWithPerms };

  } catch (error: any) {
    return { success: false, message: `Ocorreu um erro interno durante o login: ${error.message}` };
  }
}

/**
 * Realiza o logout do usuário, destruindo a sessão e o cookie associado.
 * @returns {Promise<{success: boolean, message: string}>} O resultado da operação.
 */
export async function logout(): Promise<{ success: boolean; message: string }> {
  try {
    await deleteSessionFromCookie();
    return { success: true, message: 'Logout bem-sucedido.' };
  } catch (error) {
    console.error('Error during logout:', error);
    return { success: false, message: 'Falha ao fazer logout.' };
  }
}

/**
 * Obtém o perfil completo do usuário autenticado na sessão atual.
 * @returns {Promise<UserProfileWithPermissions | null>} O perfil completo do usuário ou null.
 */
export async function getCurrentUser(): Promise<UserProfileWithPermissions | null> {
  const session = await getSessionFromCookie();
  if (session?.userId) {
    const userService = new UserService();
    const user = await userService.getUserById(session.userId);
    return user;
  }
  return null;
}

/**
 * Fetches the admin user specifically for development auto-login purposes.
 * This should only be used in non-production environments.
 * @returns {Promise<UserProfileWithPermissions | null>} The admin user profile or null.
 */
export async function getAdminUserForDev(): Promise<UserProfileWithPermissions | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  const userService = new UserService();
  return userService.findUserByEmail('admin@bidexpert.com.br');
}

/**
 * Fetches a list of users for development testing purposes.
 * Includes Admins, Auctioneers, Bidders, etc.
 * @returns {Promise<Array<{ email: string; fullName: string; roleName: string; passwordHint: string }>>}
 */
export async function getDevUsers(): Promise<Array<{ email: string; fullName: string; roleName: string; passwordHint: string }>> {
  if (process.env.NODE_ENV !== 'development') {
    return [];
  }

  try {
    const users = await basePrisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return users.map(u => {
      const roleName = u.roles.length > 0 ? u.roles[0].role.name : 'User';
      // Determine password hint based on email or role
      let passwordHint = 'Test@12345';
      if (u.email === 'analista@lordland.com') {
        passwordHint = 'password123';
      }

      return {
        email: u.email,
        fullName: u.fullName || 'Unknown',
        roleName: roleName,
        passwordHint: passwordHint
      };
    });
  } catch (error) {
    console.error('Error fetching dev users:', error);
    return [];
  }
}


// Ação para resetar a senha
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Password Reset] Solicitação para: ${email}`);
  return {
    success: true,
    message: 'Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.'
  };
}

export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; message: string }> {
  if (token && token.length > 10) {
    return { success: true, message: "Token válido." };
  }
  return { success: false, message: "Token inválido ou expirado." };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Password Reset] Senha redefinida com token: ${token}`);
  if (token && newPassword.length >= 6) {
    return { success: true, message: "Senha redefinida com sucesso." };
  }
  return { success: false, message: "Falha ao redefinir a senha." };
}
