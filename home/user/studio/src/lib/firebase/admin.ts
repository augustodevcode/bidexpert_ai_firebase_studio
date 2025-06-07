// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs'; // Importar módulo fs

// ============================================================================
// ATENÇÃO: Configuração da Chave de Conta de Serviço
// ============================================================================
// Substitua '/caminho/para/sua/chave-firebase-adminsdk.json' pelo caminho
// real para o arquivo JSON da sua chave de conta de serviço.
// Recomenda-se usar variáveis de ambiente em produção e manter a chave segura.
// Exemplo de caminho relativo: path.resolve(__dirname, '../../../../sua-chave-firebase-adminsdk.json')
// Exemplo de caminho absoluto: '/home/user/studio/sua-chave-firebase-adminsdk.json'
const serviceAccountPath = path.resolve(__dirname, '../SEU_ARQUIVO_CHAVE.json'); // <--- AJUSTE O CAMINHO AQUI
// ============================================================================

try {
  // Tenta inicializar o Admin SDK apenas se não houver apps inicializados
  if (!admin.apps.length) {
    console.log('Inicializando Firebase Admin SDK...');

    // Carregar a chave da conta de serviço usando fs
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Se necessário, adicione outras configurações como databaseURL, storageBucket
      // databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
      // storageBucket: "<BUCKET_NAME>.appspot.com",
    });
    console.log('Firebase Admin SDK inicializado com sucesso.');
  } else {
    console.log('Firebase Admin SDK já inicializado.');
  }
} catch (error: any) {
  console.error('Erro na inicialização do Firebase Admin SDK:', error);
  if (error.code === 'app/duplicate-app') {
      console.error('Causa comum: Tentativa de inicializar o Admin SDK mais de uma vez.');
  } else if (error.code === 'ENOENT') {
      console.error('Causa comum: Arquivo da chave de conta de serviço não encontrado. Verifique o caminho:', serviceAccountPath);
  } else {
      console.error('Detalhes do erro:', error.message);
  }
  // Dependendo do seu ambiente, pode ser necessário sair do processo em caso de falha crítica
  // process.exit(1);
}

// Exporte a instância do Firestore para ser usada em outros lugares
export const dbAdmin = admin.firestore();
console.log('Instância do Firestore (dbAdmin) exportada.');

// Você também pode exportar outros serviços se precisar
// export const authAdmin = admin.auth();
// export const storageAdmin = admin.storage();