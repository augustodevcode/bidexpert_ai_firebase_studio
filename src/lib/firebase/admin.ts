// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let dbAdmin: admin.firestore.Firestore | undefined = undefined;
let authAdmin: admin.auth.Auth | undefined = undefined;
let storageAdmin: admin.storage.Storage | undefined = undefined;

// Caminho relativo da raiz do projeto para o arquivo admin.ts: src/lib/firebase/admin.ts
// Para voltar para a raiz do projeto a partir de __dirname (que é src/lib/firebase): ../../../
const serviceAccountPath = path.resolve(__dirname, '../../../bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');

try {
  if (!admin.apps.length) {
    console.log('[Firebase Admin SDK Central] Tentando inicializar...');
    
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // storageBucket: "bidexpert-630df.appspot.com", // Descomente se for usar o Firebase Storage
        });
        console.log('[Firebase Admin SDK Central] Admin SDK inicializado com sucesso via arquivo de chave.');
        dbAdmin = admin.firestore();
        authAdmin = admin.auth();
        storageAdmin = admin.storage();
        console.log('[Firebase Admin SDK Central] Instâncias dbAdmin, authAdmin e storageAdmin obtidas após nova inicialização.');
    } else {
        console.error(`[Firebase Admin SDK Central] ERRO CRÍTICO: Arquivo da chave de conta de serviço NÃO ENCONTRADO em: ${serviceAccountPath}`);
        console.error("[Firebase Admin SDK Central] Verifique se o nome do arquivo está correto e se o arquivo existe no diretório raiz do projeto.");
    }
  } else {
    console.log('[Firebase Admin SDK Central] Admin SDK já estava inicializado.');
    const app = admin.apps[0]!; 
    dbAdmin = app.firestore();
    authAdmin = app.auth();
    storageAdmin = app.storage();
    console.log('[Firebase Admin SDK Central] Instâncias dbAdmin, authAdmin e storageAdmin obtidas de app existente.');
  }
} catch (error: any) {
  console.error('[Firebase Admin SDK Central] ERRO CRÍTICO durante a configuração do Admin SDK:', error);
  if (error.code === 'ENOENT' && error.path === serviceAccountPath) {
      console.error(`[Firebase Admin SDK Central] Causa Provável: Arquivo da chave de conta de serviço não encontrado no caminho especificado: ${serviceAccountPath}`);
  }
  console.error('[Firebase Admin SDK Central] Operações dependentes do Admin SDK podem falhar.');
}

export { dbAdmin, authAdmin, storageAdmin };
