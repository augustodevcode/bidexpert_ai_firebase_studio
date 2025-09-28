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
import { prisma as basePrisma } from '@/lib/prisma'; // Use a instância base para operações globais de usuário

/**
 * Formata um objeto de usuário bruto do Prisma para o tipo `UserProfileWithPermissions`,
 * enriquecendo-o com uma lista de permissões consolidadas de seus perfis e uma
 * lista de nomes de perfis para fácil acesso.
 * @param {any} user - O objeto de usuário retornado pelo Prisma, incluindo `roles` e `tenants`.
 * @returns {UserProfileWithPermissions | null} O perfil formatado ou null se o usuário for inválido.
 */
function formatUserWithPermissions(user: any): UserProfileWithPermissions | null {
    if (!user) return null;

    const roles: Role[] = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = Array.from(new Set(roles.flatMap((r: any) => {
        if (typeof r.permissions === 'string') {
            return r.permissions.split(',');
        }
        if (Array.isArray(r.permissions)) {
            return r.permissions;
        }
        return [];
    })));
    const tenants: Tenant[] = user.tenants?.map((ut: any) => ut.tenant) || [];

    return {
        ...user,
        id: user.id,
        uid: user.id,
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
    
    if (!tenantId && user.tenants?.length === 1) {
        tenantId = user.tenants[0].tenantId;
    } else if (!tenantId && user.tenants && user.tenants.length > 1) {
        const userProfile = formatUserWithPermissions(user);
        return { success: true, message: 'Selecione um espaço de trabalho.', user: userProfile };
    }
    
    const userBelongsToTenant = user.tenants?.some(t => t.tenantId === tenantId);
    if (tenantId && !userBelongsToTenant) {
        console.log(`[Login Action] Falha: Usuário '${email}' não pertence ao tenant '${tenantId}'.`);
        return { success: false, message: 'Credenciais inválidas para este espaço de trabalho.' };
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

    await createSession(userProfileWithPerms, tenantId!);

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
 * Obtém a sessão atual do usuário a partir do cookie.
 * @returns {Promise<any | null>} O payload da sessão decodificado ou null.
 */
export async function getSession() {
    return await getSessionFromCookie();
}

/**
 * Obtém o perfil completo do usuário autenticado na sessão atual.
 * @returns {Promise<UserProfileWithPermissions | null>} O perfil completo do usuário ou null.
 */
export async function getCurrentUser(): Promise<UserProfileWithPermissions | null> {
    const session = await getSessionFromCookie();
    if (!session?.userId) {
        return null;
    }

    const user = await basePrisma.user.findUnique({
        where: { id: session.userId },
        include: { 
            roles: { include: { role: true } },
            tenants: { include: { tenant: true } }
        }
    });

    if (!user) {
        return null;
    }

    return formatUserWithPermissions(user);
}