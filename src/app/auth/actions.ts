// src/app/auth/actions.ts
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
    const permissions = user.role?.permissions.map(p => p.name) || [];
    
    const userProfileWithPerms: UserProfileWithPermissions = {
      ...user,
      uid: user.id,
      roleName: user.role?.name || 'USER',
      permissions: permissions,
    };

    await createSession(userProfileWithPerms);
    
    // Revalidação não é necessária aqui, a criação do cookie será lida na próxima requisição.
    // O redirecionamento será feito no lado do cliente.
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

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId as string },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });
        
        if (!user) {
            return null;
        }

        const permissions = user.role?.permissions.map(p => p.name) || [];

        return {
            ...user,
            uid: user.id,
            roleName: user.role?.name || 'USER',
            permissions: permissions,
        } as UserProfileWithPermissions;
    } catch (error) {
        console.error('[getCurrentUser Action] Error fetching user from DB:', error);
        return null;
    }
}