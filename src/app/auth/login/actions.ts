// src/app/auth/login/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { createSession, getSession, deleteSession } from '@/lib/session';
import type { UserProfileWithPermissions } from '@/types';
import { revalidatePath } from 'next/cache';


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
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: { name: true, permissions: true }
        }
      }
    });

    if (!user || !user.password) {
      return { success: false, message: 'Credenciais inválidas.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    // As permissões agora vêm como { name: string }[]
    const permissions = user.role?.permissions.map(p => p.id) || [];
    
    const userProfileWithPerms: UserProfileWithPermissions = {
      ...user,
      uid: user.id,
      roleName: user.role?.name || 'USER',
      permissions: permissions,
    };

    await createSession(userProfileWithPerms);
    
    return { success: true, message: 'Login bem-sucedido!' };

  } catch (error) {
    console.error('[Login Action] Error:', error);
    return { success: false, message: 'Ocorreu um erro interno durante o login.' };
  }
}
