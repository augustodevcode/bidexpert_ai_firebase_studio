"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// check-admin-sdk.ts
var admin = require("firebase-admin");
var fs = require("fs"); // Adicionado para ler a chave JSON
// ============================================================================
// ATENÇÃO: Configuração da Chave de Conta de Serviço
// ============================================================================
// SUBSTITUA pelo caminho real para o arquivo JSON da sua chave.
// Recomenda-se usar variáveis de ambiente para o caminho em ambientes de produção.
// Exemplo de caminho relativo: path.resolve(__dirname, '../seu-nome-chave.json')
var serviceAccountPath = '/home/user/studio/bidexpert-630df-firebase-adminsdk-fbsvc-4c89838d15.json'; // <--- CAMINHO CORRIGIDO
// ============================================================================
console.log('--- Verificação do Firebase Admin SDK ---');
try {
    // Verifica se o Admin SDK já foi inicializado
    if (admin.apps.length === 0) {
        console.log('Admin SDK não inicializado. Tentando inicializar...');
        // Carrega a chave da conta de serviço usando fs
        var serviceAccount = void 0;
        try {
            var serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
            serviceAccount = JSON.parse(serviceAccountJson);
        }
        catch (readError) {
            console.error('Erro ao ler ou analisar o arquivo da chave de conta de serviço:', readError);
            console.error('Verifique se o caminho para a chave está correto e se o arquivo existe:', serviceAccountPath);
            if (readError.code === 'ENOENT') {
                console.error('Causa comum: Arquivo da chave de conta de serviço não encontrado.');
            }
            process.exit(1); // Sai do processo se a chave não puder ser lida
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // Se necessário, adicione outras configurações como databaseURL, storageBucket
            // databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
        });
        console.log('Admin SDK inicializado com sucesso.');
    }
    else {
        console.log('Admin SDK já está inicializado.');
        console.log('Número de apps Firebase inicializados:', admin.apps.length);
    }
    // Verifica a disponibilidade da instância do Firestore
    try {
        var db = admin.firestore();
        if (db) {
            console.log('Instância do Firestore (admin.firestore()) está disponível.');
            console.log('Projeto ID da instância do Firestore:', db.projectId);
        }
        else {
            // Este bloco pode não ser atingido se admin.firestore() lançar um erro em vez de retornar null/undefined
            console.log('Instância do Firestore (admin.firestore()) NÃO está disponível (retornou falsy).');
        }
    }
    catch (error) {
        console.error('Erro ao obter ou verificar a instância do Firestore:', error);
        console.error('Detalhes do erro:', error.message, error.code);
    }
}
catch (error) {
    console.error('Erro geral durante a verificação/inicialização do Admin SDK:', error);
    if (error.code === 'app/duplicate-app') {
        console.error('Causa comum: Tentativa de inicializar o Admin SDK mais de uma vez.');
    }
    else {
        console.error('Detalhes do erro:', error.message, error.code);
    }
}
console.log('--- Fim da Verificação ---');
