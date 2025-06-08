
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let dbAdmin: admin.firestore.Firestore | undefined = undefined;
let authAdmin: admin.auth.Auth | undefined = undefined;
let storageAdmin: admin.storage.Storage | undefined = undefined;
let isInitializing = false;
let adminAppPromise: Promise<admin.App | undefined> | null = null;
let initializationError: Error | null = null;

// Prioriza GOOGLE_APPLICATION_CREDENTIALS, fallback para caminho manual
const serviceAccountPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const manualServiceAccountPath = path.resolve(process.cwd(), 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');

function initializeAdminApp(): Promise<admin.App | undefined> {
    if (admin.apps.length > 0 && admin.apps[0]) {
        console.log('[Firebase Admin SDK Central] Admin SDK já estava inicializado, app principal recuperado.');
        return Promise.resolve(admin.apps[0]);
    }
    if (isInitializing && adminAppPromise) {
        console.warn('[Firebase Admin SDK Central] Inicialização já em andamento, aguardando promise existente.');
        return adminAppPromise;
    }

    isInitializing = true;
    initializationError = null; 
    console.log('[Firebase Admin SDK Central] Tentando inicializar...');

    adminAppPromise = new Promise((resolve) => {
        try {
            let serviceAccount;
            let initMethod = "";

            if (serviceAccountPathFromEnv) {
                if (fs.existsSync(serviceAccountPathFromEnv)) {
                    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPathFromEnv, 'utf8'));
                    initMethod = "GOOGLE_APPLICATION_CREDENTIALS";
                } else {
                    console.warn(`[Firebase Admin SDK Central] Arquivo da chave em GOOGLE_APPLICATION_CREDENTIALS não encontrado: ${serviceAccountPathFromEnv}. Tentando caminho manual.`);
                }
            }
            
            if (!serviceAccount) {
                if (fs.existsSync(manualServiceAccountPath)) {
                    serviceAccount = JSON.parse(fs.readFileSync(manualServiceAccountPath, 'utf8'));
                    initMethod = "caminho manual";
                } else {
                    initializationError = new Error(`Arquivo da chave de conta de serviço NÃO ENCONTRADO em GOOGLE_APPLICATION_CREDENTIALS nem no caminho manual: ${manualServiceAccountPath}`);
                    console.error(`[Firebase Admin SDK Central] ERRO CRÍTICO: ${initializationError.message}`);
                    resolve(undefined);
                    return;
                }
            }

            const app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: `${serviceAccount.project_id}.appspot.com`
            });
            console.log(`[Firebase Admin SDK Central] Admin SDK inicializado com sucesso via ${initMethod}.`);
            resolve(app);
        } catch (error: any) {
            initializationError = error;
            console.error('[Firebase Admin SDK Central] ERRO CRÍTICO durante a configuração do Admin SDK:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            resolve(undefined);
        } finally {
            isInitializing = false; 
        }
    });
    return adminAppPromise;
}


export async function ensureAdminInitialized(): Promise<{
    dbAdmin: admin.firestore.Firestore | undefined,
    authAdmin: admin.auth.Auth | undefined,
    storageAdmin: admin.storage.Storage | undefined,
    error?: Error | null
}> {
    let currentApp = admin.apps.length > 0 ? admin.apps[0] : undefined;

    if (!currentApp) {
        currentApp = await initializeAdminApp();
    }

    if (currentApp) {
        dbAdmin = currentApp.firestore();
        authAdmin = currentApp.auth();
        storageAdmin = currentApp.storage();
        // Se a inicialização foi bem-sucedida, reseta o erro.
        if (!initializationError && dbAdmin && authAdmin && storageAdmin) { 
             console.log('[Firebase Admin SDK Central] ensureAdminInitialized: Instâncias obtidas com sucesso.');
        } else if (initializationError) {
            console.error('[Firebase Admin SDK Central] ensureAdminInitialized: Erro de inicialização persistente.', JSON.stringify(initializationError, Object.getOwnPropertyNames(initializationError)));
        }
    } else {
        console.error('[Firebase Admin SDK Central] ensureAdminInitialized: App não pôde ser inicializado ou recuperado.');
         dbAdmin = undefined;
         authAdmin = undefined;
         storageAdmin = undefined;
    }
    return { dbAdmin, authAdmin, storageAdmin, error: initializationError };
}

// Exporta as instâncias para que possam ser importadas diretamente, mas use ensureAdminInitialized nas actions
export { dbAdmin, authAdmin, storageAdmin };

// Não chamar initializeAppIfNeeded() diretamente no carregamento do módulo
// Deixar que ensureAdminInitialized() lide com isso quando necessário.
