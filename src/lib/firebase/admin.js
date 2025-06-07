"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageAdmin = exports.authAdmin = exports.dbAdmin = void 0;
// src/lib/firebase/admin.ts
var admin = require("firebase-admin");
var fs = require("fs");
var dbAdmin;
var authAdmin;
var storageAdmin; // Adicionado para consistência, embora não usado ainda
var serviceAccountPath = '/home/user/studio/bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';
try {
    if (!admin.apps.length) {
        console.log('[Firebase Admin SDK Central] Inicializando...');
        // Verificar se o arquivo da chave de serviço existe
        if (!fs.existsSync(serviceAccountPath)) {
            console.error("[Firebase Admin SDK Central] ERRO CR\u00CDTICO: Arquivo da chave de conta de servi\u00E7o N\u00C3O ENCONTRADO em: ".concat(serviceAccountPath));
            console.error("[Firebase Admin SDK Central] Certifique-se de que o arquivo JSON da chave está no local correto e o caminho está certo.");
            // process.exit(1); // Em um ambiente de produção, você pode querer parar aqui.
        }
        else {
            var serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                // Se você usa Storage, adicione o bucket aqui:
                // storageBucket: "bidexpert-630df.appspot.com",
            });
            console.log('[Firebase Admin SDK Central] Inicializado com sucesso via arquivo de chave.');
        }
    }
    else {
        console.log('[Firebase Admin SDK Central] Já inicializado.');
    }
    exports.dbAdmin = dbAdmin = admin.firestore();
    exports.authAdmin = authAdmin = admin.auth();
    exports.storageAdmin = storageAdmin = admin.storage(); // Inicializa o storage admin
    console.log('[Firebase Admin SDK Central] Instâncias dbAdmin, authAdmin e storageAdmin obtidas.');
}
catch (error) {
    console.error('[Firebase Admin SDK Central] ERRO CRÍTICO durante a inicialização:', error);
    if (error.code === 'ENOENT') {
        console.error("[Firebase Admin SDK Central] Causa Prov\u00E1vel: Arquivo da chave de conta de servi\u00E7o n\u00E3o encontrado no caminho especificado: ".concat(serviceAccountPath));
    }
    console.error('[Firebase Admin SDK Central] Operações dependentes do Admin SDK podem falhar.');
    // Não re-lançar o erro para permitir que o app continue, mas logar agressivamente.
    // Em um cenário de produção, um tratamento mais robusto seria necessário.
}
