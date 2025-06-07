// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let dbAdmin: admin.firestore.Firestore;
let authAdmin: admin.auth.Auth;
let storageAdmin: admin.storage.Storage; // Adicionado para consistência, embora não usado ainda

const serviceAccountPath = '/home/user/studio/bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';

try {
  if (!admin.apps.length) {
    console.log('[Firebase Admin SDK Central] Inicializando...');
    
    // Verificar se o arquivo da chave de serviço existe
    if (!fs.existsSync(serviceAccountPath)) {
        console.error(`[Firebase Admin SDK Central] ERRO CRÍTICO: Arquivo da chave de conta de serviço NÃO ENCONTRADO em: ${serviceAccountPath}`);
        console.error("[Firebase Admin SDK Central] Certifique-se de que o arquivo JSON da chave está no local correto e o caminho está certo.");
        // process.exit(1); // Em um ambiente de produção, você pode querer parar aqui.
    } else {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // Se você usa Storage, adicione o bucket aqui:
            // storageBucket: "bidexpert-630df.appspot.com",
        });
        console.log('[Firebase Admin SDK Central] Inicializado com sucesso via arquivo de chave.');
    }
  } else {
    console.log('[Firebase Admin SDK Central] Já inicializado.');
  }
  
  dbAdmin = admin.firestore();
  authAdmin = admin.auth();
  storageAdmin = admin.storage(); // Inicializa o storage admin
  console.log('[Firebase Admin SDK Central] Instâncias dbAdmin, authAdmin e storageAdmin obtidas.');

} catch (error: any) {
  console.error('[Firebase Admin SDK Central] ERRO CRÍTICO durante a inicialização:', error);
  if (error.code === 'ENOENT') {
      console.error(`[Firebase Admin SDK Central] Causa Provável: Arquivo da chave de conta de serviço não encontrado no caminho especificado: ${serviceAccountPath}`);
  }
  console.error('[Firebase Admin SDK Central] Operações dependentes do Admin SDK podem falhar.');
  // Não re-lançar o erro para permitir que o app continue, mas logar agressivamente.
  // Em um cenário de produção, um tratamento mais robusto seria necessário.
}

// Exporte as instâncias para serem usadas em outros lugares
// @ts-ignore dbAdmin will be initialized or error logged
export { dbAdmin, authAdmin, storageAdmin };
