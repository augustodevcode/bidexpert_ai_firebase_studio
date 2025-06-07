
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let dbAdmin: admin.firestore.Firestore | undefined = undefined;
let authAdmin: admin.auth.Auth | undefined = undefined;
let storageAdmin: admin.storage.Storage | undefined = undefined;
let isInitializing = false; 
let adminApp: admin.App | undefined = undefined;

// Correção: Caminho relativo da raiz do projeto onde o JSON da chave está
const serviceAccountPath = path.resolve(process.cwd(), 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');

async function initializeAppIfNeeded() {
    if (admin.apps.length === 0 && !isInitializing) {
        isInitializing = true;
        console.log('[Firebase Admin SDK Central] Tentando inicializar...');
        try {
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                adminApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    storageBucket: `${serviceAccount.project_id}.appspot.com`
                });
                console.log('[Firebase Admin SDK Central] Admin SDK inicializado com sucesso via arquivo de chave.');
            } else {
                console.error(`[Firebase Admin SDK Central] ERRO CRÍTICO: Arquivo da chave de conta de serviço NÃO ENCONTRADO em: ${serviceAccountPath}`);
                adminApp = undefined; // Garante que app não seja usado se o arquivo não for encontrado
            }
        } catch (error: any) {
            console.error('[Firebase Admin SDK Central] ERRO CRÍTICO durante a configuração do Admin SDK:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
    } else if (!isInitializing) {
        // Se adminApp não foi definido e não estamos no meio de uma tentativa de inicialização, logue um aviso
        console.warn('[Firebase Admin SDK Central] Admin App não está definido após tentativa de inicialização. dbAdmin, authAdmin, storageAdmin podem estar undefined.');
    }
}

export async function ensureAdminInitialized(): Promise<{ 
    dbAdmin: admin.firestore.Firestore | undefined, 
    authAdmin: admin.auth.Auth | undefined, 
    storageAdmin: admin.storage.Storage | undefined 
}> {
    if (!adminApp && !isInitializing) { 
        await initializeAppIfNeeded();
    } else if (isInitializing) {
        console.warn('[Firebase Admin SDK Central] ensureAdminInitialized chamado enquanto a inicialização está em andamento.');
        // Espera um pouco para a inicialização concorrente terminar.
        // Não é ideal, um sistema de Promise de inicialização única seria melhor.
        await new Promise(resolve => setTimeout(resolve, 500)); 
        if (!adminApp && admin.apps.length > 0) { // Tenta pegar o app se outro fluxo inicializou
            adminApp = admin.apps[0]!;
            if (adminApp) {
                if (!dbAdmin) dbAdmin = adminApp.firestore();
                if (!authAdmin) authAdmin = adminApp.auth();
                if (!storageAdmin) storageAdmin = adminApp.storage();
            }
        }
    }
    return { dbAdmin, authAdmin, storageAdmin };
}

export { dbAdmin, authAdmin, storageAdmin };

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') { 
    initializeAppIfNeeded().catch(err => {
        console.error("[Firebase Admin SDK Central] Erro na inicialização proativa:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    });
}
