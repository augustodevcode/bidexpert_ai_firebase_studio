// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let dbAdmin: admin.firestore.Firestore | undefined = undefined;
let authAdmin: admin.auth.Auth | undefined = undefined;
let storageAdmin: admin.storage.Storage | undefined = undefined;
let isInitializing = false; // Declarar e inicializar isInitializing aqui

// Para voltar para a raiz do projeto a partir de __dirname (que é src/lib/firebase): ../../../
const serviceAccountPath = path.resolve(__dirname, '../../../bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');
// Lógica de inicialização principal no corpo do módulo
try {
  if (!admin.apps.length) {
    // A inicialização agora será feita na função ensureAdminInitialized
    console.log('[Firebase Admin SDK Central] Inicialização adiada para ensureAdminInitialized.');
  } else {
    // Se já estiver inicializado (e este módulo for reavaliado), pegue as instâncias
    console.log('[Firebase Admin SDK Central] Admin SDK já estava inicializado (ao carregar módulo).');
    try {
        const app = admin.apps[0]!;
        dbAdmin = app.firestore();
        authAdmin = app.auth();
        storageAdmin = app.storage();
        console.log('[Firebase Admin SDK Central] Instâncias dbAdmin, authAdmin e storageAdmin obtidas de app existente (ao carregar módulo).');
    } catch (err: any) {
        console.error('[Firebase Admin SDK Central] ERRO ao obter instâncias de app existente (ao carregar módulo):', err);
    }
  }
} catch (error: any) {
  // Captura erros durante a fase inicial de carregamento do módulo (menos provável, mas seguro)
  console.error('[Firebase Admin SDK Central] ERRO GERAL durante o carregamento inicial do módulo:', error);
}

export async function ensureAdminInitialized(): Promise<{ dbAdmin: admin.firestore.Firestore | undefined, authAdmin: admin.auth.Auth | undefined, storageAdmin: admin.storage.Storage | undefined }> {
    if (admin.apps.length > 0) {
        // Já inicializado, retorne as instâncias atuais
         const app = admin.apps[0]!;
         // Garante que as variáveis exportadas também sejam atualizadas se já estiver inicializado aqui
         if (!dbAdmin) dbAdmin = app.firestore();
         if (!authAdmin) authAdmin = app.auth();
         if (!storageAdmin) storageAdmin = app.storage();
         return { dbAdmin, authAdmin, storageAdmin };
    }

    if (isInitializing) {
        // Já está inicializando, pode ser necessário um mecanismo mais robusto para esperar a Promise,
        // mas para este exemplo simples, vamos apenas retornar as variáveis atuais (que serão undefined)
        console.warn('[Firebase Admin SDK Central] ensureAdminInitialized chamado enquanto a inicialização está em andamento.');
        return { dbAdmin, authAdmin, storageAdmin };
    }

    isInitializing = true;
    console.log('[Firebase Admin SDK Central] Tentando inicializar via ensureAdminInitialized...');

    try {
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('[Firebase Admin SDK Central] Admin SDK inicializado com sucesso via arquivo de chave.');
            dbAdmin = admin.firestore();
            authAdmin = admin.auth();
            storageAdmin = admin.storage();
            console.log('[Firebase Admin SDK Central] Instâncias dbAdmin, authAdmin e storageAdmin obtidas.');
        } else {
            console.error(`[Firebase Admin SDK Central] ERRO CRÍTICO: Arquivo da chave de conta de serviço NÃO ENCONTRADO em: ${serviceAccountPath}`);
            console.error("[Firebase Admin SDK Central] Verifique se o nome do arquivo está correto e se o arquivo existe no diretório raiz do projeto.");
        }
    } catch (error: any) {
        console.error('[Firebase Admin SDK Central] ERRO CRÍTICO durante a configuração do Admin SDK em ensureAdminInitialized:', error);
        if (error.code === 'ENOENT' && error.path === serviceAccountPath) {
            console.error(`[Firebase Admin SDK Central] Causa Provável: Arquivo da chave de conta de serviço não encontrado no caminho especificado: ${serviceAccountPath}`);
        }
        console.error('[Firebase Admin SDK Central] Operações dependentes do Admin SDK podem falhar.');
    } finally {
        isInitializing = false; // Resetar a flag após a tentativa
    }

    // Retornar as instâncias (podem ser undefined se houver erro)
    return { dbAdmin, authAdmin, storageAdmin };
}

// Exportar as variáveis também, mas elas só terão valor definido após a primeira chamada de ensureAdminInitialized
export { dbAdmin, authAdmin, storageAdmin };
