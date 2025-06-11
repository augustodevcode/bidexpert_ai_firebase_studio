
'use server';
import { getDatabaseAdapter } from '@/lib/database';
import type { SqlAuthResult, UserProfileData } from '@/types';
// Em um cenário de produção, você usaria bcrypt para senhas
// import bcrypt from 'bcryptjs';

export async function authenticateUserSql(
  email: string,
  passwordAttempt: string
): Promise<SqlAuthResult> {
  const db = await getDatabaseAdapter();
  try {
    // Esta função getUserByEmail precisa ser implementada no seu adaptador de banco de dados
    const userProfile = await db.getUserByEmail(email.toLowerCase());

    if (!userProfile) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // ATENÇÃO: Comparação de senha em TEXTO PLANO - MUITO INSEGURO PARA PRODUÇÃO
    // Em produção, você faria algo como:
    // const isMatch = await bcrypt.compare(passwordAttempt, userProfile.passwordHash);
    // Por agora, para o protótipo, comparamos diretamente.
    // Certifique-se de que 'password_text' existe no seu UserProfileData para SQL e contém a senha.
    if (userProfile.password === passwordAttempt) { // Assumindo que userProfile.password contém a senha em texto plano do DB
      // Remover a senha antes de retornar o perfil
      const { password, ...userToReturn } = userProfile;
      return {
        success: true,
        message: 'Login bem-sucedido (SQL)!',
        user: userToReturn as UserProfileData, 
      };
    } else {
      return { success: false, message: 'Senha incorreta.' };
    }
  } catch (error: any) {
    console.error('[authenticateUserSql] Erro:', error);
    return { success: false, message: error.message || 'Erro durante a autenticação SQL.' };
  }
}
