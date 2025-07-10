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

  console.log(`[Login Action] Iniciando tentativa de login para: ${email}`);
  
  if (!email || !password) {
    console.log('[Login Action] Erro: Email ou senha não fornecidos.');
    return { success: false, message: 'Email e senha são obrigatórios.' };
  }
  
  try {
    const db = await getDatabaseAdapter();
    const usersWithPermissions = await db.getUsersWithRoles();
    const user = usersWithPermissions.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user || !user.password) {
      console.log(`[Login Action] Usuário não encontrado ou sem senha definida para o email: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    console.log(`[Login Action] Usuário encontrado:`, { uid: user.uid, email: user.email, roleName: user.roleName });
    console.log(`[Login Action] Senha do formulário: [PROTEGIDO]`);
    console.log(`[Login Action] Senha do banco de dados (exemplo): "${user.password}"`);

    const isSampleData = (process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA') === 'SAMPLE_DATA';
    
    let isPasswordValid = false;
    if (isSampleData) {
      console.log('[Login Action] Modo SampleData: Comparando senhas como texto plano.');
      isPasswordValid = (password === user.password);
    } else {
      console.log('[Login Action] Modo BD Real: Comparando senhas com bcrypt.');
      isPasswordValid = await bcrypt.compare(password, user.password);
    }
    
    console.log(`[Login Action] A senha é válida? ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log(`[Login Action] Senha inválida para o usuário: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    await createSession(user);
    
    console.log(`[Login Action] Sessão criada com sucesso para ${email}`);
    return { success: true, message: 'Login bem-sucedido!' };

  } catch (error) {
    console.error('[Login Action] Erro interno:', error);
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
    
    return user as UserProfileWithPermissions;
}
