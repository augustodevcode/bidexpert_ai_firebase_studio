// src/app/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession, deleteSession } from '@/lib/session';
import type { UserProfileWithPermissions } from '@bidexpert/core';
import { revalidatePath } from 'next/cache';
import { UserService } from '@bidexpert/core';

const userService = new UserService();

/**
 * Realiza o login de um usuário com base no email e senha.
 * Verifica as credenciais, e se forem válidas, cria uma sessão criptografada em um cookie.
 * @param formData - O FormData do formulário de login, contendo email e senha.
 * @returns Um objeto indicando o sucesso ou falha da operação, e o perfil do usuário em caso de sucesso.
 */
export async function login(formData: FormData): Promise<{ success: boolean; message: string; user?: UserProfileWithPermissions | null }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const result = await userService.authenticateUser(email, password);

  if (result.success && result.user) {
    await createSession(result.user);
  }

  return result;
}

/**
 * Realiza o logout do usuário, excluindo a sessão do cookie.
 */
export async function logout() {
  await deleteSession();
  if (process.env.NODE_ENV !== 'test') {
    revalidatePath('/', 'layout'); // Garante que o layout seja re-renderizado como "deslogado"
  }
  redirect('/');
}

/**
 * Obtém os dados do usuário logado atualmente com base na sessão do cookie.
 * @returns O perfil do usuário com permissões, ou null se não houver sessão válida.
 */
export async function getCurrentUser(): Promise<UserProfileWithPermissions | null> {
    console.log('[GetCurrentUser] Buscando sessão atual...');
    const session = await getSession();
    if (!session || !session.userId) {
        console.log('[GetCurrentUser] Sessão não encontrada ou inválida.');
        return null;
    }
    
    console.log(`[GetCurrentUser] Sessão encontrada para userId: ${session.userId}. Buscando usuário no DB...`);
    const user = await userService.getUserById(session.userId);

    if (!user) {
        console.warn(`[GetCurrentUser] Usuário com ID ${session.userId} da sessão não encontrado no banco de dados.`);
        return null;
    }
    
    console.log(`[GetCurrentUser] Usuário ${user.email} encontrado e formatado.`);
    return user;
}
