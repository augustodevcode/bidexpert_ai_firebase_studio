// src/app/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession, deleteSession } from '@/lib/session';
import type { UserProfileWithPermissions, Role } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuidv4';

function formatUserWithPermissions(user: any): UserProfileWithPermissions | null {
    if (!user) return null;

    const roles = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = roles.flatMap((r: any) => r.permissions as string[] || []);

    return {
        ...user,
        uid: user.id, // Garantir que uid seja o mesmo que id
        roleNames: roles.map((r: any) => r.name),
        permissions,
        // For compatibility with older components that might expect a single roleName
        roleName: roles[0]?.name,
    };
}


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
        include: { 
            roles: {
                include: {
                    role: true, // Include the actual Role data
                }
            }
        }
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

    const userProfileWithPerms = formatUserWithPermissions(user);

    if (!userProfileWithPerms) {
      return { success: false, message: 'Falha ao formatar o perfil do usuário.' };
    }
    
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
        where: { id: session.userId }, // Busca pelo 'id'
        include: { 
            roles: {
                include: {
                    role: true,
                }
            }
        }
    });
    
    return formatUserWithPermissions(user);
}
