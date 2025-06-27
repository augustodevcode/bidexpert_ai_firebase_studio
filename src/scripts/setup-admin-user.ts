// scripts/setup-admin-user.ts
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { getDatabaseAdapter } from '../lib/database/index';

// ============================================================================
// CONFIGURAÇÕES DO USUÁRIO ADMINISTRADOR
// ============================================================================
const ADMIN_EMAIL = 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = '@dmin2025';
const ADMIN_FULL_NAME = 'Administrador BidExpert';
const ADMIN_TARGET_ROLE_NAME = 'ADMINISTRATOR';
// Para sistemas SQL, UID fixo para o admin principal
const ADMIN_UID_FOR_SQL = 'admin-bidexpert-platform-001';
// ============================================================================

async function setupAdminUser() {
    // A fonte da verdade para o sistema ativo é o `getDatabaseAdapter`. Não definimos um default aqui.
    const envSystem = process.env.ACTIVE_DATABASE_SYSTEM?.toUpperCase();
    console.log(`[Admin Script] Configurando usuário ${ADMIN_EMAIL} como ${ADMIN_TARGET_ROLE_NAME}. Sistema de DB (do .env): ${envSystem || 'Não definido, usará default do adapter'}`);

    try {
        const dbAdapter = await getDatabaseAdapter();

        // 1. Garantir que os perfis padrão existam, especialmente o de Administrador.
        let adminRole = await dbAdapter.getRoleByName(ADMIN_TARGET_ROLE_NAME);
        if (!adminRole) {
            console.log(`[Admin Script] Perfil '${ADMIN_TARGET_ROLE_NAME}' não encontrado. Tentando criar perfis padrão...`);
            await dbAdapter.ensureDefaultRolesExist();
            adminRole = await dbAdapter.getRoleByName(ADMIN_TARGET_ROLE_NAME);
            if (!adminRole) {
                console.error(`[Admin Script] CRÍTICO: Perfil '${ADMIN_TARGET_ROLE_NAME}' ainda não encontrado após ensure. O script de inicialização do DB (db:init) foi executado com sucesso?`);
                process.exit(1);
            }
            console.log(`[Admin Script] Perfil '${ADMIN_TARGET_ROLE_NAME}' encontrado/criado com sucesso.`);
        }

        // 2. Criar ou atualizar o usuário administrador no banco de dados.
        const uidToUse = envSystem === 'FIRESTORE' ? `auth-uid-placeholder-for-${ADMIN_EMAIL}` : ADMIN_UID_FOR_SQL;
        console.log(`[Admin Script] Garantindo perfil de usuário no banco de dados para UID: ${uidToUse}, Email: ${ADMIN_EMAIL}, Role: ${ADMIN_TARGET_ROLE_NAME}`);
        
        const profileResult = await dbAdapter.ensureUserRole(
            uidToUse,
            ADMIN_EMAIL,
            ADMIN_FULL_NAME,
            ADMIN_TARGET_ROLE_NAME, 
            { 
              password: ADMIN_PASSWORD,
              habilitationStatus: 'HABILITADO' // Admin já é habilitado por padrão
            }
        );

        if (profileResult.success) {
            console.log(`[Admin Script] Perfil para ${ADMIN_EMAIL} (UID: ${uidToUse}) configurado com sucesso no banco de dados com o perfil ${ADMIN_TARGET_ROLE_NAME}.`);
        } else {
            console.error(`[Admin Script] Falha ao configurar perfil no banco de dados para ${ADMIN_EMAIL}: ${profileResult.message}`);
        }
        
    } catch (error: any) {
        console.error(`[Admin Script] Erro fatal durante a configuração do usuário administrador:`, error);
        process.exit(1);
    }
}

async function main() {
    const envPathLocal = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPathLocal)) {
      dotenv.config({ path: envPathLocal });
    } else {
      dotenv.config();
    }
    
    await setupAdminUser();

    // Desconectar o pool de banco de dados se a função existir no adaptador
    const dbAdapter = await getDatabaseAdapter();
    if (typeof (dbAdapter as any).disconnect === 'function') {
        await (dbAdapter as any).disconnect();
    }
}

main().then(() => {
    console.log("[Admin Script] Processo finalizado com sucesso.");
    process.exit(0);
}).catch(err => {
    console.error("[Admin Script] Erro não tratado no script setup-admin-user:", err);
    process.exit(1);
});
