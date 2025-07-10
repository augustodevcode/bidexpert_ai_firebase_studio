// src/app/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { getDatabaseAdapter } from '@/lib/database';
import { createSession, getSession, deleteSession } from '@/lib/session';
import type { UserProfileData } from '@/types';
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
  
  const db = await getDatabaseAdapter();
  const users = await db.getUsersWithRoles();
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user || !user.password) {
    return { success: false, message: 'Credenciais inválidas.' };
  }

  // NOTE: bcrypt should be used in a real DB scenario. 
  // For sample data with plain text passwords, this check is simplified.
  const isPasswordValid = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM === 'SAMPLE_DATA' 
    ? password === user.password 
    : await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { success: false, message: 'Credenciais inválidas.' };
  }
  
  // Fetch permissions based on role
  const roles = await db.getRoles();
  const userRole = roles.find(r => r.id === user.roleId);
  const userWithPermissions = { ...user, permissions: userRole?.permissions || [] };

  await createSession(userWithPermissions);
    
  return { success: true, message: 'Login bem-sucedido!' };
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
export async function getCurrentUser(): Promise<UserProfileData | null> {
    const session = await getSession();
    if (!session || !session.userId) {
        return null;
    }
    const db = await getDatabaseAdapter();
    const user = await db.getUserProfileData(session.userId);
    return user;
}
