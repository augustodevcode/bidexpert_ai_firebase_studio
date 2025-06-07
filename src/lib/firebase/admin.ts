// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let dbAdmin: admin.firestore.Firestore | undefined = undefined;
let authAdmin: admin.auth.Auth | undefined = undefined;
let storageAdmin: admin.storage.Storage | undefined = undefined;
let isInitializing = false; 
let adminApp: admin.App | undefined = undefined;

const serviceAccountPath = path.resolve(__dirname, '../../../bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');

async function initializeAppIfNeeded() {
    if (admin.apps.length === 0 && !isInitializing) {
        isInitializing = true;
        console.log('[Firebase Admin SDK Central] Tentando inicializar...');
        try {
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                adminApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    storageBucket: `${serviceAccount.project_id}.appspot.com` // Adicionado storageBucket
                });
                console.log('[Firebase Admin SDK Central] Admin SDK inicializado com sucesso via arquivo de chave.');
            } else {
                console.error(`[Firebase Admin SDK Central] ERRO CRÍTICO: Arquivo da chave de conta de serviço NÃO ENCONTRADO em: ${serviceAccountPath}`);
            }
        } catch (error: any) {
            console.error('[Firebase Admin SDK Central] ERRO CRÍTICO durante a configuração do Admin SDK:', error);
            adminApp = undefined; // Garante que app não seja usado se falhar
        } finally {
            isInitializing = false;
        }
    } else if (admin.apps.length > 0 && !adminApp) {
        adminApp = admin.apps[0]!;
         console.log('[Firebase Admin SDK Central] Admin SDK já estava inicializado, app principal recuperado.');
    }

    if (adminApp) {
        if (!dbAdmin) dbAdmin = adminApp.firestore();
        if (!authAdmin) authAdmin = adminApp.auth();
        if (!storageAdmin) storageAdmin = adminApp.storage();
    }
}

export async function ensureAdminInitialized(): Promise<{ 
    dbAdmin: admin.firestore.Firestore | undefined, 
    authAdmin: admin.auth.Auth | undefined, 
    storageAdmin: admin.storage.Storage | undefined 
}> {
    if (!adminApp && !isInitializing) { // Apenas inicializa se não estiver inicializado E não estiver em processo
        await initializeAppIfNeeded();
    } else if (isInitializing) {
        // Se estiver inicializando, espera um pouco e tenta de novo ou retorna estado atual
        // Para simplificar, vamos apenas logar. Uma implementação mais robusta usaria um Promise de inicialização.
        console.warn('[Firebase Admin SDK Central] ensureAdminInitialized chamado enquanto a inicialização está em andamento.');
    }
    return { dbAdmin, authAdmin, storageAdmin };
}

// Exportar as variáveis também, mas elas podem ser undefined se a inicialização falhar
export { dbAdmin, authAdmin, storageAdmin };

// Inicialização proativa ao carregar o módulo, mas protegida.
// O objetivo é que as actions possam chamar ensureAdminInitialized se necessário.
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') { // Evita rodar em alguns contextos de teste/build
    initializeAppIfNeeded().catch(err => {
        console.error("[Firebase Admin SDK Central] Erro na inicialização proativa:", err);
    });
}
