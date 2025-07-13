// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

let adminApp: App | undefined;

function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';
  const manualPath = path.join(process.cwd(), serviceAccountKeyFileName);

  if (!fs.existsSync(manualPath)) {
    console.error(`[Admin SDK Error] Service account key file not found at path: ${manualPath}`);
    throw new Error(`Arquivo de chave de serviço não encontrado: ${serviceAccountKeyFileName}. Verifique se o arquivo está na raiz do projeto.`);
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
    const app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    console.log('[Admin SDK] Firebase Admin SDK inicializado com sucesso.');
    return app;
  } catch (error: any) {
    console.error('[Admin SDK Error] Falha ao inicializar o Firebase Admin:', error);
    throw new Error(`Erro ao inicializar o Admin SDK: ${error.message}`);
  }
}

export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  error?: null;
  alreadyInitialized: boolean;
} {
  const alreadyInitialized = getApps().length > 0;
  
  if (!adminApp) {
    adminApp = initializeAdminApp();
  }
  
  return {
    app: adminApp,
    db: getFirestore(adminApp),
    storage: getStorage(adminApp),
    alreadyInitialized,
  };
}

// Para manter a compatibilidade com o código legado que pode estar usando a exportação nomeada `db`
const { db } = ensureAdminInitialized();
export { db };
