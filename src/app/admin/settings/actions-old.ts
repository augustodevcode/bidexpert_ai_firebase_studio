// src/app/admin/settings/actions-old.ts
'use server';

import { exec } from 'child_process';
import util from 'util';

// Mantemos a ação de seed aqui para separá-la da lógica de negócio.
export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    console.log('[ACTION] runFullSeedAction triggered.');
    const execPromise = util.promisify(exec);
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
