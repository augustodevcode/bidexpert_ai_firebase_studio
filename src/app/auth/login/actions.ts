// src/app/auth/login/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import bcrypt from 'bcrypt';
import { createSession } from '@/lib/session';
import type { UserProfileData, UserProfileWithPermissions } from '@/types';

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
    // A função getUsersWithRoles já combina usuários com seus papéis e permissões
    const usersWithRoles = await db.getUsersWithRoles();
    const user = usersWithRoles.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user || !user.password) {
      console.log(`[Login Action] User not found or password not set for email: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    // A senha no sample-data está em texto plano, então bypassamos a verificação do bcrypt para esse caso.
    const activeDbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    const isSampleData = activeDbSystem === 'SAMPLE_DATA';
    
    console.log(`[Login Action] Authenticating for user ${email}. System: ${activeDbSystem}. Is Sample Data: ${isSampleData}`);
    
    const isPasswordValid = isSampleData 
        ? (password === user.password) 
        : await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[Login Action] Invalid password for user: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    // O objeto 'user' de getUsersWithRoles já deve conter as permissões.
    const userProfileWithPerms: UserProfileWithPermissions = user;

    await createSession(userProfileWithPerms);
    
    console.log(`[Login Action] Session created successfully for ${email}`);
    return { success: true, message: 'Login bem-sucedido!' };

  } catch (error) {
    console.error('[Login Action] Error:', error);
    return { success: false, message: 'Ocorreu um erro interno durante o login.' };
  }
}
