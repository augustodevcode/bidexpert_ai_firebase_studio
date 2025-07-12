// src/app/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession, deleteSession } from '@/lib/session';
import type { UserProfileWithPermissions } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { getDatabaseAdapter } from '@/lib/database';

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
    const db = getDatabaseAdapter();
    const users = await db.getUsersWithRoles();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || !user.password) {
      console.log(`[Login Action] Usuário não encontrado ou sem senha definida para o email: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    console.log(`[Login Action] Usuário encontrado:`, { id: user.id, email: user.email });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log(`[Login Action] A senha é válida? ${isPasswordValid}`);

    if (!isPasswordValid) {
      // DEVELOPMENT ONLY: Bypass password check for admin user
      if (user.email.toLowerCase() === 'admin@bidexpert.com.br') {
        console.log('[Login Action] Bypass de senha para o usuário admin ativado.');
      } else {
        console.log(`[Login Action] Senha inválida para o usuário: ${email}`);
        return { success: false, message: 'Credenciais inválidas.' };
      }
    }
    
    await createSession(user as UserProfileWithPermissions);
    
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
    
    const db = getDatabaseAdapter();
    const user = await db.getUserProfileData(session.userId);

    if (!user) return null;
    
    return user as UserProfileWithPermissions;
}

/**
 * DEVELOPMENT ONLY: Automatically logs in the admin user if no session exists.
 * @returns The admin user profile if successful, otherwise null.
 */
export async function loginAdminForDevelopment(): Promise<UserProfileWithPermissions | null> {
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    console.log('[Dev Action] Tentando login automático do admin...');
    const db = getDatabaseAdapter();
    const users = await db.getUsersWithRoles();
    const adminUser = users.find(u => u.email.toLowerCase() === 'admin@bidexpert.com.br');

    if (adminUser) {
        await createSession(adminUser as UserProfileWithPermissions);
        console.log('[Dev Action] Sessão de admin criada para desenvolvimento.');
        return adminUser as UserProfileWithPermissions;
    }
    
    console.warn('[Dev Action] Usuário admin não encontrado para login automático.');
    return null;
}
