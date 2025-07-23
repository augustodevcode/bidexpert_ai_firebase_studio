// src/app/setup/actions.ts
'use server';

import { prisma } from '@/lib/prisma';

/**
 * Verifica se os dados essenciais (ex: roles e settings) existem no banco de dados.
 * Usado para validar se o setup/seed inicial foi bem-sucedido.
 * @returns {Promise<{success: boolean; message: string}>}
 */
export async function verifyInitialData(): Promise<{ success: boolean; message: string }> {
  console.log('[Setup Action] Verificando dados iniciais no banco...');
  try {
    const settingsCount = await prisma.platformSettings.count();
    const rolesCount = await prisma.roles.count();

    if (settingsCount > 0 && rolesCount > 0) {
      console.log('[Setup Action] Verificação bem-sucedida. Dados encontrados.');
      return { success: true, message: 'Dados essenciais encontrados.' };
    } else {
      console.warn('[Setup Action] Falha na verificação. Dados essenciais não encontrados.', { settingsCount, rolesCount });
      return { 
        success: false, 
        message: `Dados essenciais não encontrados. Itens de configuração: ${settingsCount}, Perfis: ${rolesCount}. Por favor, popule o banco de dados.` 
      };
    }
  } catch (error: any) {
    console.error('[Setup Action] Erro ao verificar dados iniciais:', error);
    return { success: false, message: `Erro de conexão com o banco de dados: ${error.message}` };
  }
}
