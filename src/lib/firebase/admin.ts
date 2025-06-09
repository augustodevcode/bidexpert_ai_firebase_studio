
// src/lib/firebase/admin.ts
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue as FirebaseAdminFieldValue,
  Timestamp as FirebaseAdminTimestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

let adminAppInternalInstance: App | undefined;
let dbAdminInternalInstance: Firestore | undefined;
let authAdminInternalInstance: Auth | undefined;
let storageAdminInternalInstance: Storage | undefined;
let sdkInitializationError: Error | null = null;

// Nome do arquivo da chave de serviço.
// Este arquivo DEVE estar na raiz do projeto se GOOGLE_APPLICATION_CREDENTIALS não estiver definida.
const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';

export function ensureAdminInitialized(): {
  app?: App; // Renomeado para clareza
  db?: Firestore;
  auth?: Auth;
  storage?: Storage;
  error?: Error | null;
} {
  if (sdkInitializationError) {
    console.warn('[Admin SDK] Retornando erro de inicialização anterior:', sdkInitializationError.message);
    return { error: sdkInitializationError };
  }

  if (adminAppInternalInstance && dbAdminInternalInstance && authAdminInternalInstance) {
    // console.log('[Admin SDK] Retornando instâncias cacheadas.');
    return { 
      app: adminAppInternalInstance, 
      db: dbAdminInternalInstance, 
      auth: authAdminInternalInstance, 
      storage: storageAdminInternalInstance, 
      error: null 
    };
  }
  
  console.log('[Admin SDK] Tentando garantir que o admin está inicializado.');

  try {
    if (!getApps().length) {
      console.log('[Admin SDK] Nenhuma app Firebase inicializada. Tentando inicializar uma nova.');
      let serviceAccount: object | undefined;
      let usedPath: string | undefined;
      
      const credentialsPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPathFromEnv}`);

      if (credentialsPathFromEnv) {
        if (fs.existsSync(credentialsPathFromEnv)) {
          try {
            const serviceAccountJsonString = fs.readFileSync(credentialsPathFromEnv, 'utf8');
            serviceAccount = JSON.parse(serviceAccountJsonString);
            usedPath = credentialsPathFromEnv;
            console.log(`[Admin SDK] Chave de serviço carregada de GOOGLE_APPLICATION_CREDENTIALS: ${usedPath}`);
          } catch (e: any) {
            sdkInitializationError = new Error(`Falha ao carregar/parsear chave de GOOGLE_APPLICATION_CREDENTIALS ('${credentialsPathFromEnv}'): ${e.message}`);
            console.error(`[Admin SDK] ${sdkInitializationError.message}`);
            return { error: sdkInitializationError };
          }
        } else {
          console.warn(`[Admin SDK] Caminho GOOGLE_APPLICATION_CREDENTIALS não existe: ${credentialsPathFromEnv}. Tentando caminho manual.`);
        }
      }

      if (!serviceAccount) {
        const manualPath = path.resolve(process.cwd(), serviceAccountKeyFileName);
        console.log(`[Admin SDK] Tentando carregar chave de serviço do caminho manual: ${manualPath} (CWD: ${process.cwd()})`);
        if (fs.existsSync(manualPath)) {
          try {
            const serviceAccountJsonString = fs.readFileSync(manualPath, 'utf8');
            serviceAccount = JSON.parse(serviceAccountJsonString);
            usedPath = manualPath;
            console.log(`[Admin SDK] Chave de serviço carregada do caminho manual: ${usedPath}`);
          } catch (e: any) {
            sdkInitializationError = new Error(`Falha ao carregar/parsear chave do caminho manual ('${manualPath}'): ${e.message}`);
            console.error(`[Admin SDK] ${sdkInitializationError.message}`);
            return { error: sdkInitializationError };
          }
        } else {
          sdkInitializationError = new Error(`Arquivo da chave de serviço não encontrado. Verificado GOOGLE_APPLICATION_CREDENTIALS ('${credentialsPathFromEnv}') e caminho manual ('${manualPath}').`);
          console.error(`[Admin SDK] ${sdkInitializationError.message}`);
          return { error: sdkInitializationError };
        }
      }
      
      if (!serviceAccount) { 
          sdkInitializationError = new Error(`CRÍTICO: Chave de conta de serviço JSON não pôde ser carregada de nenhuma fonte. Verifique GOOGLE_APPLICATION_CREDENTIALS ou se '${serviceAccountKeyFileName}' está na raiz do projeto.`);
          console.error(`[Admin SDK] ${sdkInitializationError.message}`);
          return { error: sdkInitializationError };
      }

      console.log(`[Admin SDK] Inicializando app com chave de serviço de: ${usedPath}`);
      adminAppInternalInstance = initializeApp({ credential: cert(serviceAccount) });
      console.log('[Admin SDK] Firebase Admin SDK inicializado com sucesso (nova app).');
    } else {
      adminAppInternalInstance = getApp();
      console.log('[Admin SDK] Usando app Firebase Admin existente.');
    }

    // Obter serviços somente após garantir que adminAppInternalInstance está definido
    dbAdminInternalInstance = getFirestore(adminAppInternalInstance);
    authAdminInternalInstance = getAuth(adminAppInternalInstance);
    try {
      storageAdminInternalInstance = getStorage(adminAppInternalInstance);
    } catch (storageError: any) {
      console.warn('[Admin SDK] Não foi possível inicializar o Storage Admin (OK se não for usado):', storageError.message);
      storageAdminInternalInstance = undefined; // Explicitamente undefined se falhar
    }
    console.log('[Admin SDK] Serviços Firestore, Auth e Storage (se aplicável) obtidos.');
    sdkInitializationError = null; // Limpa erro anterior se tudo correu bem

  } catch (error: any) {
    const detailedError = error.message ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(error));
    console.error(`[Admin SDK] CRITICAL ERROR durante ensureAdminInitialized: ${detailedError}`);
    sdkInitializationError = new Error(`Falha na inicialização do Firebase Admin SDK: ${detailedError}`);
    return { error: sdkInitializationError };
  }

  return { 
    app: adminAppInternalInstance, 
    db: dbAdminInternalInstance, 
    auth: authAdminInternalInstance, 
    storage: storageAdminInternalInstance,
    error: null 
  };
}

export const AdminFieldValue = FirebaseAdminFieldValue;
export const ServerTimestamp = FirebaseAdminTimestamp;

// NOTA: As exportações abaixo são para conveniência e tipos, mas as actions DEVEM
// obter suas instâncias de db, auth, storage a partir do retorno de ensureAdminInitialized().
export { 
    adminAppInternalInstance as adminApp,
    dbAdminInternalInstance as dbAdmin, // Firestore admin instance
    authAdminInternalInstance as authAdmin,   // Auth admin instance
    storageAdminInternalInstance as storageAdmin // Storage admin instance
};
