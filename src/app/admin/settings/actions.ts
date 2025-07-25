// src/app/admin/settings/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { PlatformSettings } from '@/types';
import { revalidatePath } from 'next/cache';
import { exec } from 'child_process';
import util from 'util';
import { fetchPlatformSettings } from '@/lib/data-queries';

const execPromise = util.promisify(exec);


export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  // A action agora chama a função centralizada para consistência.
  return fetchPlatformSettings();
}

export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    try {
        const currentSettings = await prisma.platformSettings.findFirst();
        if (currentSettings) {
            await prisma.platformSettings.update({
                where: { id: currentSettings.id },
                data
            });
        } else {
             await prisma.platformSettings.create({
                // @ts-ignore
                data: data
             });
        }
        revalidatePath('/', 'layout');
        return { success: true, message: 'Configurações atualizadas com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
    }
}

export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    console.log('[ACTION] runFullSeedAction triggered.');
    try {
        const { stdout, stderr } = await execPromise('npm run db:seed');
        console.log('[ACTION] db:seed stdout:', stdout);
        if (stderr) {
            console.error('[ACTION] db:seed stderr:', stderr);
            if (stderr.toLowerCase().includes('error')) {
                 throw new Error(stderr);
            }
        }
        return { success: true, message: 'Banco de dados populado com dados de demonstração com sucesso!' };
    } catch (error: any) {
        console.error('[ACTION] Error executing db:seed script:', error);
        return { success: false, message: `Falha ao executar o script de seed: ${error.message}` };
    }
}

// Danger Zone Actions - Use with caution
export async function resetSampleDataAction(): Promise<{ success: boolean; message: string; }> {
    return { success: false, message: 'Ação não suportada. Use "Resetar Banco de Dados" e "db:seed" para recomeçar.' };
}

export async function dropAllTablesAction(): Promise<{ success: boolean; message: string; }> {
     return { success: false, message: 'Ação não implementada para este adaptador.' };
}
