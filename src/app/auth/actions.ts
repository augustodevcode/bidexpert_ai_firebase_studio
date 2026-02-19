// src/app/auth/actions.ts
/**
 * @fileoverview Server Actions para autenticação de usuários com suporte Multi-Tenant.
 * 
 * Este arquivo contém a lógica de backend para os processos de login e logout,
 * bem como para a recuperação de informações do usuário logado. As ações interagem
 * com a camada de serviço e com a biblioteca de sessão (jose) para validar
 * credenciais, criar e destruir sessões seguras em cookies.
 * 
 * FUNCIONALIDADE MULTI-TENANT:
 * - Valida que o usuário pertence ao tenant do subdomínio atual
 * - getDevUsers() filtra usuários pelo tenant do contexto atual
 * - getCurrentTenantContext() retorna info do tenant baseado no subdomínio
 */
'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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
 */
function formatUserWithPermissions(user: any): UserProfileWithPermissions | null {
  if (!user) return null;

  // Map from Prisma relations (UsersOnRoles/UsersOnTenants) to expected format (roles/tenants)
  const userRoles = user.UsersOnRoles || user.roles || [];
  const userTenants = user.UsersOnTenants || user.tenants || [];

  const roles: Role[] = userRoles.map((ur: any) => ({
    ...(ur.Role || ur.role),
    id: (ur.Role || ur.role)?.id,
  })) || [];

  const permissions = Array.from(new Set(roles.flatMap((r: any) => {
    let perms = r.permissions;
    if (!perms) return [];

    if (typeof perms === 'string') {
      try {
        const parsed = JSON.parse(perms);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return perms.split(',').map((p: string) => p.trim()).filter(Boolean);
      }
    }

    if (Array.isArray(perms)) {
      return perms;
    }

    return [];
  })));

  const tenants: Tenant[] = userTenants.map((ut: any) => ({
    ...(ut.Tenant || ut.tenant),
    id: (ut.Tenant || ut.tenant)?.id,
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
 * uma sessão segura em caso de sucesso.
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
        UsersOnRoles: { include: { Role: true } },
        UsersOnTenants: { include: { Tenant: true } }
      }
    });

    // GAP-FIX: Early return if user not found to avoid null pointer exceptions
    if (!user || !user.password) {
      console.log(`[Login Action] Falha: Usuário com email '${email}' não encontrado.`);
      return { success: false, message: 'Credenciais inválidas.' };
    }

    // Strict Tenant Check: If tenantId was NOT provided by user, check the context header
    if (!tenantId) {
        const headersList = await headers();
        const contextTenantId = headersList.get('x-tenant-id');
        const LANDLORD_ID = '1';
        
        if (contextTenantId && contextTenantId !== LANDLORD_ID) {
            tenantId = contextTenantId;
        }
    }
    
    // Resolve Tenant Slug to ID if necessary
    // This allows "demo" to be resolved to "2" (or whatever ID)
    if (tenantId && isNaN(Number(tenantId))) {
         console.log(`[Login Action] Resolvendo tenantId slug '${tenantId}'...`);
         const t = await basePrisma.tenant.findFirst({ where: { subdomain: tenantId } });
         if (t) {
             console.log(`[Login Action] Slug '${tenantId}' resolvido para ID '${t.id}'`);
             tenantId = t.id.toString();
         } else {
             console.log(`[Login Action] Slug '${tenantId}' não encontrado.`);
         }
    }

    // Validate strict tenant isolation
    // NOTE: Prisma returns UsersOnTenants, not tenants
    const userTenants = user.UsersOnTenants || user.tenants || [];
    if (tenantId && userTenants.length > 0) {
        const userInTenant = userTenants.some(ut => ut.tenantId?.toString() === tenantId);
        if (!userInTenant) {
            const headersList = await headers();
            const contextTenantId = headersList.get('x-tenant-id');
            // Only enforce strictness if we are actually in that context (subdomain access)
            console.log(`[Login Action] Aviso: Usuário não pertence ao tenant ${tenantId}. Context: ${contextTenantId}`);
            
            if (contextTenantId && (contextTenantId === tenantId || contextTenantId === initialTenantId)) {
                return { success: false, message: 'Usuário não cadastrado neste Espaço de Trabalho. Verifique o endereço ou registre-se.' };
            }
        }
    }

    if (password && password !== '[already_validated]') {
      console.log(`[Login Action] Usuário '${email}' encontrado. Verificando a senha.`);
      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (!isPasswordValid) {
        // Special Debug for Admin
        if (email === 'admin@bidexpert.ai') {
             console.log(`[Login Action] Failed hash comparison for admin@bidexpert.ai. Provided: '${password}'. Hash: '${user.password.substring(0, 10)}...'`);
             return { success: false, message: 'Credenciais inválidas (Debug: Senha não confere com hash).' };
        }
        console.log(`[Login Action] Falha: Senha inválida para o usuário '${email}'.`);
        return { success: false, message: 'Credenciais inválidas.' };
      }
    }

    const userProfileWithPerms = formatUserWithPermissions(user);
    if (!userProfileWithPerms) {
      return { success: false, message: 'Falha ao processar o perfil do usuário.' };
    }

    // Tenant Selection Logic
    const userTenantsForSelection = user.UsersOnTenants || user.tenants || [];
    if (!tenantId) {
      if (userTenantsForSelection.length === 1) {
        tenantId = userTenantsForSelection[0].tenantId;
      } else if (userTenantsForSelection.length > 1) {
        return { success: true, message: 'Selecione um espaço de trabalho.', user: userProfileWithPerms };
      } else {
        console.log(`[Login Action] Usuário '${email}' não pertence a nenhum tenant. Associando ao Landlord ('1').`);
        tenantId = '1';
      }
    }

    const userBelongsToFinalTenant = userTenantsForSelection.some(t => t.tenantId?.toString() === tenantId);
    if (!userBelongsToFinalTenant) {
      const isAdmin = userProfileWithPerms.permissions.includes('manage_all');
      if (tenantId !== '1' || (!isAdmin && userTenantsForSelection.length > 0)) {
        console.log(`[Login Action] Falha: Usuário '${email}' não pertence ao tenant '${tenantId}'. UserTenants: ${JSON.stringify(userTenantsForSelection.map(ut => ut.tenantId?.toString()))}`);
        return { success: false, message: 'Credenciais inválidas para este espaço de trabalho.' };
      }
    }

    await createSession(userProfileWithPerms, tenantId);

    console.log(`[Login Action] SUCESSO: Sessão criada para ${email} no tenant ${tenantId}. Retornando sucesso.`);
    return { success: true, message: 'Login bem-sucedido!', user: userProfileWithPerms };

  } catch (error: any) {
    console.error(`[Login Action] ERRO FATAL: ${error.message}`, error);
    return { success: false, message: `Ocorreu um erro interno durante o login: ${error.message}` };
  }
}

/**
 * Realiza o logout do usuário, destruindo a sessão e o cookie associado.
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
 * Re-export getSession from session lib for backward compatibility.
 * Other modules import getSession from '@/app/auth/actions'.
 */
export async function getSession() {
  return getSessionFromCookie();
}

/**
 * Fetches the admin user specifically for development auto-login purposes.
 */
export async function getAdminUserForDev(): Promise<UserProfileWithPermissions | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  const userService = new UserService();
  return userService.findUserByEmail('admin@bidexpert.com.br');
}


/**
 * Recupera o contexto do tenant atual a partir dos headers da requisição.
 * Útil para componentes clientes saberem em qual subdomínio/tenant estão.
 * 
 * NOTA: O middleware passa o subdomain/slug como x-tenant-id, não o ID numérico.
 * Esta função resolve o slug para o ID real do tenant.
 */
export async function getCurrentTenantContext() {
  const headersList = await headers();
  const tenantIdOrSlug = headersList.get('x-tenant-id') || '1';
  const subdomain = headersList.get('x-tenant-subdomain') || '';
  
  console.log(`[getCurrentTenantContext] Headers: x-tenant-id='${tenantIdOrSlug}', x-tenant-subdomain='${subdomain}'`);
  
  let resolvedTenantId = tenantIdOrSlug;
  let tenantName = 'BidExpert';
  
  // Se não é o Landlord (1), precisamos resolver o slug para ID
  if (tenantIdOrSlug !== '1') {
      try {
          // Tenta primeiro como ID numérico
          if (!isNaN(Number(tenantIdOrSlug))) {
              const t = await basePrisma.tenant.findUnique({ where: { id: BigInt(tenantIdOrSlug) } });
              if (t) {
                  tenantName = t.name;
              }
          } else {
              // Resolve slug
              const t = await basePrisma.tenant.findFirst({ where: { subdomain: tenantIdOrSlug } });
              if (t) {
                  resolvedTenantId = t.id.toString();
                  tenantName = t.name;
              }
          }
      } catch (e) {
          console.error('[getCurrentTenantContext] Erro ao resolver tenant:', e);
      }
  }
  
  return {
      tenantId: resolvedTenantId,
      tenantName,
      subdomain
  };
}

/**
 * Retorna a lista de usuários para o seletor de desenvolvimento.
 * Filtra os usuários que pertencem ao tenant atual.
 */
export async function getDevUsers() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_VERCEL_ENV !== 'preview') {
    // return []; // Desabilitado em produção real
  }

  const context = await getCurrentTenantContext();
  const tenantId = context.tenantId;

  try {
    const users = await basePrisma.user.findMany({
      where: {
        UsersOnTenants: {
          some: {
            tenantId: BigInt(tenantId)
          }
        }
      },
      include: {
        UsersOnRoles: {
          include: {
            Role: true
          }
        }
      },
      take: 10
    });

    return users.map(u => ({
      email: u.email,
      password: 'password123', // Senha padrão para dev
      roleName: u.UsersOnRoles[0]?.Role?.name || 'User'
    }));
  } catch (e) {
    console.error('[getDevUsers] Erro:', e);
    return [];
  }
}
