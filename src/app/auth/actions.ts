

// src/app/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession, deleteSession } from '@/lib/session';
import type { UserProfileWithPermissions, Role } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Realiza o login de um usuário com base no email e senha.
 * Verifica as credenciais, e se forem válidas, cria uma sessão criptografada em um cookie.
 * @param formData - O FormData do formulário de login, contendo email e senha.
 * @returns Um objeto indicando o sucesso ou falha da operação.
 */
export async function login(formData: FormData): Promise<{ success: boolean; message: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log(`[Login Action] Iniciando tentativa de login para: ${email}`);
  
  if (!email || !password) {
    console.log('[Login Action] Erro: Email ou senha não fornecidos.');
    return { success: false, message: 'Email e senha são obrigatórios.' };
  }
  
  try {
    const user = await prisma.user.findUnique({ 
        where: { email },
        include: { roles: true }
    });

    if (!user || !user.password) {
      console.log(`[Login Action] Usuário não encontrado ou sem senha definida para o email: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    console.log(`[Login Action] Usuário encontrado:`, { id: user.id, email: user.email });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log(`[Login Action] A senha é válida? ${isPasswordValid}`);

    if (!isPasswordValid) {
        console.log(`[Login Action] Senha inválida para o usuário: ${email}`);
        return { success: false, message: 'Credenciais inválidas.' };
    }

    const userProfileWithPerms: UserProfileWithPermissions = {
        ...user,
        roleName: user.roles[0]?.name,
        roleNames: user.roles.map(r => r.name),
        permissions: user.roles.flatMap(r => r.permissions as string[]) || [],
    };
    
    await createSession(userProfileWithPerms);
    
    console.log(`[Login Action] Sessão criada com sucesso para ${email}`);
    return { success: true, message: 'Login bem-sucedido!' };

  } catch (error: any) {
    console.error('[Login Action] Erro interno:', error);
    return { success: false, message: `Ocorreu um erro interno durante o login: ${error.message}` };
  }
}

/**
 * Realiza o logout do usuário, excluindo a sessão do cookie.
 */
export async function logout() {
  await deleteSession();
  revalidatePath('/', 'layout'); // Garante que o layout seja re-renderizado como "deslogado"
  redirect('/');
}

/**
 * Obtém os dados do usuário logado atualmente com base na sessão do cookie.
 * @returns O perfil do usuário com permissões, ou null se não houver sessão válida.
 */
export async function getCurrentUser(): Promise<UserProfileWithPermissions | null> {
    const session = await getSession();
    if (!session || !session.userId) {
        return null;
    }
    
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { roles: true }
    });

    if (!user) return null;

    const userProfileWithPerms: UserProfileWithPermissions = {
        ...user,
        roleName: user.roles[0]?.name,
        roleNames: user.roles.map(r => r.name),
        permissions: user.roles.flatMap(r => r.permissions as string[]),
    };
    
    return userProfileWithPerms;
}

/**
 * DEVELOPMENT ONLY: Creates a virtual admin user or fetches from DB and creates a session.
 * @returns The admin user profile if successful, otherwise null.
 */
export async function loginAdminForDevelopment(): Promise<UserProfileWithPermissions | null> {
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    console.log('[Dev Action] Tentando login automático do admin...');
    
    try {
        const adminEmail = 'admin@bidexpert.com.br';
        let adminUser = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: { roles: true }
        });
        
        if (!adminUser) {
          throw new Error('[Dev Action] Admin user not found in DB. This should be handled by seeding.');
        }

        const userProfileWithPerms: UserProfileWithPermissions = {
            ...adminUser,
            roleName: adminUser.roles[0]?.name,
            roleNames: adminUser.roles.map(r => r.name),
            permissions: adminUser.roles.flatMap(r => r.permissions as string[])
        };

        await createSession(userProfileWithPerms);
        console.log('[Dev Action] Sessão de admin para desenvolvimento criada com sucesso.');
        return userProfileWithPerms;

    } catch (error) {
        console.error("[Dev Action] Erro ao tentar logar com admin:", error);
        return null;
    }
}
