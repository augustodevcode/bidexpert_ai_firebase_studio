// src/app/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { getDatabaseAdapter } from '@/lib/database/index';
import { createSession, getSession, deleteSession } from '@/lib/session';
import type { UserProfileData, UserProfileWithPermissions } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

/**
 * Realiza o login de um usuário com base no email e senha.
 * Verifica as credenciais, e se forem válidas, cria uma sessão criptografada em um cookie.
 * @param formData - O FormData do formulário de login, contendo email e senha.
 * @returns Um objeto indicando o sucesso ou falha da operação.
 */
export async function login(formData: FormData): Promise<{ success: boolean; message: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: 'Email e senha são obrigatórios.' };
  }
  
  try {
    const db = await getDatabaseAdapter();
    // getUsersWithRoles já retorna o perfil completo com nome da role e permissões.
    const usersWithPermissions = await db.getUsersWithRoles();
    const user = usersWithPermissions.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user || !user.password) {
      console.log(`[Login Action] User not found or password not set for email: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }

    const isSampleData = (process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA') === 'SAMPLE_DATA';
    
    // A senha para dados de exemplo é texto plano, para bancos de dados reais, é criptografada.
    const isPasswordValid = isSampleData 
      ? password === user.password 
      : await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[Login Action] Invalid password for user: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    // Cria a sessão usando o objeto 'user' que já contém as permissões.
    await createSession(user);
    
    console.log(`[Login Action] Session created successfully for ${email}`);
    return { success: true, message: 'Login bem-sucedido!' };

  } catch (error) {
    console.error('[Login Action] Error:', error);
    return { success: false, message: 'Ocorreu um erro interno durante o login.' };
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
    const db = await getDatabaseAdapter();
    const user = await db.getUserProfileData(session.userId);

    if (!user) return null;
    
    // A função getUserProfileData já deve retornar o usuário com as permissões.
    return user as UserProfileWithPermissions;
}
