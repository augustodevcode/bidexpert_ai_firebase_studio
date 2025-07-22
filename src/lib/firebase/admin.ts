// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
// Importa o JSON diretamente. O bundler do Next.js cuidará disso.
import serviceAccount from '../../../bidexpert-630df-firebase-adminsdk-fbsvc-4c89838d15.json'; 

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

// Armazena a instância inicializada para evitar múltiplas inicializações.
let adminApp: App | null = null;

/**
 * Garante que o Firebase Admin app esteja inicializado e retorna as instâncias necessárias.
 * Utiliza o padrão Singleton para evitar re-inicializações em ambientes serverless.
 * @returns Um objeto contendo a app, db e storage do Firebase Admin.
 */
export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  error?: null;
} {
  if (!adminApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log("[firebase/admin.ts] LOG: Usando app Firebase Admin existente.");
      adminApp = existingApps[0];
    } else {
      console.log("[firebase/admin.ts] LOG: Inicializando novo app Firebase Admin.");
      adminApp = initializeApp({
        // Força a tipagem do serviceAccount para o tipo esperado pelo credential.cert
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
      });
    }
  }

  return {
    app: adminApp,
    db: getFirestore(adminApp),
    storage: getStorage(adminApp),
  };
}

// Para compatibilidade com código legado que possa usar 'db' diretamente.
const { db } = ensureAdminInitialized();
export { db };
