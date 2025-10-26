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
import type { UserProfileWithPermissions, Role, Tenant, UserCreationData } from '@/types';
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
      id: ur.role.id.toString(), // Convert BigInt to string
    })) || [];

    const permissions = Array.from(new Set(roles.flatMap((r: any) => {
        if (typeof r.permissions === 'string') {
            return r.permissions.split(',');
        }
        if (Array.isArray(r.permissions)) {
            return r.permissions;
        }
        return [];
    })));
    
    const tenants: Tenant[] = user.tenants?.map((ut: any) => ({
        ...ut.tenant,
        id: ut.tenant.id.toString(), // Convert BigInt to string
    })) || [];

    return {
        ...user,
        id: user.id.toString(), // Convert BigInt to string
        uid: user.id.toString(), // Convert BigInt to string
        roles,
        tenants,
        roleIds: roles.map((r: any) => r.id), // Now already strings
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
 * @param {FormData} formData - Os dados do formulário de login.
 * @returns {Promise<{ success: boolean; message: string; user?: UserProfileWithPermissions | null }>} O resultado da operação de login.
 */
export async function login(formData: FormData): Promise<{ success: boolean; message: string; user?: UserProfileWithPermissions | null }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  let tenantId = formData.get('tenantId') as string | null;

  if (!email || !password) {
    return { success: false, message: 'Email e senha são obrigatórios.' };
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
    
    console.log(`[Login Action] Usuário '${email}' encontrado. Verificando a senha.`);
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
        console.log(`[Login Action] Falha: Senha inválida para o usuário '${email}'.`);
        return { success: false, message: 'Credenciais inválidas.' };
    }

    const userProfileWithPerms = formatUserWithPermissions(user);
    if (!userProfileWithPerms) {
      return { success: false, message: 'Falha ao processar o perfil do usuário.' };
    }

    // Tenant Selection Logic
    if (!tenantId) {
        if (user.tenants?.length === 1) {
            // Se o usuário pertence a apenas um tenant, usa esse por padrão.
            tenantId = user.tenants[0].tenantId;
        } else if (user.tenants && user.tenants.length > 1) {
            // Se tem múltiplos tenants, retorna para a UI escolher.
            return { success: true, message: 'Selecione um espaço de trabalho.', user: userProfileWithPerms };
        } else {
            // Se o usuário não pertence a nenhum tenant, associa ao Landlord como fallback.
            console.log(`[Login Action] Usuário '${email}' não pertence a nenhum tenant. Associando ao Landlord (ID '1').`);
            tenantId = '1'; 
        }
    }
    
    // Verifica se o usuário pertence ao tenantId final (seja do form ou do fallback).
    const userBelongsToFinalTenant = user.tenants?.some(t => t.tenantId === tenantId);
    if (!userBelongsToFinalTenant) {
        // Se o usuário não pertence explicitamente ao tenant, mas o fallback para Landlord está sendo usado,
        // E ele não pertence a nenhum outro, permite o login no Landlord.
        // Isso cobre o caso do primeiro admin que ainda não foi associado a um tenant.
        if (tenantId !== '1' || (user.tenants && user.tenants.length > 0)) {
            console.log(`[Login Action] Falha: Usuário '${email}' não pertence ao tenant '${tenantId}'.`);
            return { success: false, message: 'Credenciais inválidas para este espaço de trabalho.' };
        }
    }
    
    // A sessão é criada para o tenant correto
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


// Ação para resetar a senha
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Password Reset] Solicitação para: ${email}`);
  // Lógica de placeholder. Em um app real, isso geraria um token seguro,
  // o salvaria no DB com uma expiração, e enviaria um email/SMS para o usuário.
  // Por agora, vamos apenas retornar uma mensagem de sucesso para a UI.
  return {
    success: true,
    message: 'Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.'
  };
}

export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; message: string }> {
  // Lógica de placeholder
  if (token && token.length > 10) {
    return { success: true, message: "Token válido." };
  }
  return { success: false, message: "Token inválido ou expirado." };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  // Lógica de placeholder
  console.log(`[Password Reset] Senha redefinida com token: ${token}`);
  if (token && newPassword.length >= 6) {
    return { success: true, message: "Senha redefinida com sucesso." };
  }
  return { success: false, message: "Falha ao redefinir a senha." };
}
