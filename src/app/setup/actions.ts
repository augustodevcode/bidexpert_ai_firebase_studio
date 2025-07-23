
// src/app/setup/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import type { Role } from '@/types';

/**
 * Verifica se os dados essenciais (ex: roles e settings) existem no banco de dados.
 * Usado para validar se o setup/seed inicial foi bem-sucedido.
 * @returns {Promise<{success: boolean; message: string}>}
 */
export async function verifyInitialData(): Promise<{ success: boolean; message: string }> {
  console.log('[Setup Action] Verificando dados iniciais no banco...');
  try {
    const settingsCount = await prisma.platformSettings.count();
    const rolesCount = await prisma.role.count();

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

/**
 * Cria o usuário administrador inicial da plataforma.
 * @param {FormData} formData - Os dados do formulário de criação do admin.
 * @returns {Promise<{success: boolean; message: string}>}
 */
export async function createAdminUser(formData: FormData): Promise<{ success: boolean; message: string }> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (!email || !password || !fullName) {
        return { success: false, message: 'Todos os campos são obrigatórios.' };
    }
    
    console.log('[Setup Action] Criando usuário administrador...');
    
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, message: 'Um usuário com este email já existe.' };
        }

        const adminRole = await prisma.role.findFirst({ where: { name: 'ADMINISTRATOR' }});
        if (!adminRole) {
            throw new Error("O perfil 'ADMINISTRATOR' não foi encontrado. Execute o passo anterior (seed) primeiro.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {                
                email,
                password: hashedPassword,
                fullName,
                accountType: 'PHYSICAL',
                habilitationStatus: 'HABILITADO',
                roleId: adminRole.id, // Correção aqui
            }
        });

        console.log(`[Setup Action] Usuário admin ${email} criado com sucesso.`);
        return { success: true, message: 'Usuário administrador criado com sucesso!' };

    } catch (error: any) {
        console.error('[Setup Action] Erro ao criar usuário admin:', error);
        return { success: false, message: `Falha ao criar administrador: ${error.message}` };
    }
}
