// src/app/setup/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { Role, UserProfileWithPermissions, Tenant } from '@/types';
import { cookies } from 'next/headers';
import { createSession } from '@/server/lib/session';
import { PlatformSettingsService } from '@/services/platform-settings.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Verifica se os dados essenciais (ex: roles e settings) existem no banco de dados.
 * Usado para validar se o setup/seed inicial foi bem-sucedido.
 * @returns {Promise<{success: boolean; message: string}>}
 */
export async function verifyInitialData(): Promise<{ success: boolean; message: string }> {
  console.log('[Setup Action] Verificando dados iniciais no banco...');
  try {
    const settingsCount = await prisma.platformSettings.count();
    const rolesCount = await prisma.role.count();

    if (settingsCount > 0 && rolesCount > 0) {
      console.log('[Setup Action] Verificação bem-sucedida. Dados encontrados.');
      return { success: true, message: 'Dados essenciais encontrados.' };
    } else {
      console.warn('[Setup Action] Falha na verificação. Dados essenciais não encontrados.', { settingsCount, rolesCount });
      return { 
        success: false, 
        message: `Dados essenciais não encontrados. Itens de configuração: ${settingsCount}, Perfis: ${rolesCount}. Por favor, popule o banco de dados.` 
      };
    }
  } catch (error: any) {
    console.error('[Setup Action] Erro ao verificar dados iniciais:', error);
    return { success: false, message: `Erro de conexão com o banco de dados: ${error.message}` };
  }
}

function formatUserForSession(user: any): UserProfileWithPermissions | null {
    if (!user) return null;

    const roles: Role[] = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = Array.from(new Set(roles.flatMap((r: any) => r.permissions || [])));
    const tenants: Tenant[] = user.tenants?.map((ut: any) => ut.tenant) || [];
    
    return {
        ...user,
        roles,
        tenants,
        roleIds: roles.map((r: any) => r.id),
        roleNames: roles.map((r: any) => r.name),
        permissions,
        roleName: roles[0]?.name,
    };
}


/**
 * Cria ou confirma o usuário administrador inicial da plataforma e loga-o.
 * @param {FormData} formData - Os dados do formulário de criação do admin.
 * @returns {Promise<{success: boolean; message: string; user?: UserProfileWithPermissions}>}
 */
export async function createAdminUser(formData: FormData): Promise<{ success: boolean; message: string; user?: UserProfileWithPermissions | null }> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (!email || !password || !fullName) {
        return { success: false, message: 'Todos os campos são obrigatórios.' };
    }
    
    console.log('[Setup Action] Criando ou confirmando usuário administrador...');
    
    try {
        const adminRole = await prisma.role.findFirst({ where: { name: 'Administrator' }});
        if (!adminRole) {
            throw new Error("O perfil 'Administrator' não foi encontrado. Execute o passo anterior (seed) primeiro.");
        }

        const landlordTenantId = '1';
        let userToLogin;

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            console.log(`[Setup Action] Usuário admin ${email} já existe. Confirmando e prosseguindo.`);
            userToLogin = existingUser;
        } else {
             console.log(`[Setup Action] Usuário admin ${email} não existe. Criando agora...`);
             const hashedPassword = await bcrypt.hash(password, 10);
             userToLogin = await prisma.user.create({
                 data: {
                     email,
                     fullName,
                     password: hashedPassword,
                     habilitationStatus: 'HABILITADO',
                     accountType: 'LEGAL',
                     roles: {
                         create: { roleId: adminRole.id, assignedBy: 'system-setup' }
                     },
                     tenants: {
                         create: { tenantId: landlordTenantId, assignedBy: 'system-setup' }
                     }
                 }
             });
        }

        // Logar o usuário recém-criado/confirmado
        const userWithRelations = await prisma.user.findUnique({
            where: { id: userToLogin.id },
            include: {
                roles: { include: { role: true } },
                tenants: { include: { tenant: true } }
            }
        });
        
        if (!userWithRelations) {
             throw new Error('Não foi possível buscar o usuário com relações para criar a sessão.');
        }

        const userProfile = formatUserForSession(userWithRelations);
        
        if (!userProfile) {
            throw new Error('Falha ao formatar o perfil do usuário para a sessão.');
        }
        
        await createSession(userProfile, landlordTenantId);
        console.log(`[Setup Action] Sessão criada para o usuário admin no tenant ${landlordTenantId}.`);

        return { success: true, message: 'Usuário administrador configurado e logado com sucesso!', user: userProfile };

    } catch (error: any) {
        console.error('[Setup Action] Erro ao criar usuário admin:', error);
        return { success: false, message: `Falha ao criar administrador: ${error.message}` };
    }
}


/**
 * Sets a cookie to mark the setup process as complete.
 * This function now runs within the context of the Landlord Tenant ('1').
 * @returns {Promise<{success: boolean}>}
 */
export async function markSetupAsComplete(): Promise<{ success: boolean; message: string }> {
  try {
    const settingsService = new PlatformSettingsService();
    // The setup completion flag is a global setting tied to the Landlord tenant.
    const result = await settingsService.updateSettings({ tenantId: '1', isSetupComplete: true });

    if (result.success) {
      console.log('[Setup Action] Platform setup marked as complete in the database.');
    } else {
      console.error('[Setup Action] Failed to mark setup as complete in DB:', result.message);
    }
    return result;

  } catch (error: any) {
      console.error('[markSetupAsComplete] Critical error updating settings:', error);
      return { success: false, message: `Erro crítico: ${error.message}` };
  }
}
