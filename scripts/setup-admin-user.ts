
// scripts/setup-admin-user.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { getDatabaseAdapter } from '../src/lib/database/index';
import { ensureUserProfileInDb } from '../src/app/admin/users/actions';
import type { Role } from '../src/types';

// ============================================================================
// CONFIGURAÇÕES DO USUÁRIO ADMINISTRADOR
// ============================================================================
const ADMIN_EMAIL = 'admin@bidexpert.com.br'; // ATUALIZADO
const ADMIN_PASSWORD = '@dmin2025'; // Mantenha uma senha forte
const ADMIN_FULL_NAME = 'Administrador BidExpert';
const ADMIN_TARGET_ROLE_NAME = 'ADMINISTRATOR';
// Para sistemas SQL, UID fixo para o admin principal
const ADMIN_UID_FOR_SQL = 'admin-bidexpert-platform-001';
// ============================================================================

// Path to your service account key file
const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';

let dbAdminInstance: admin.firestore.Firestore | null = null;
let authAdminInstance: admin.auth.Auth | null = null;

async function initializeFirebaseAdminSDK() {
  if (process.env.ACTIVE_DATABASE_SYSTEM?.toUpperCase() !== 'FIRESTORE') {
    console.log('[Admin Script] Sistema de DB não é FIRESTORE. Pulando inicialização do Firebase Admin SDK para Auth/Firestore.');
    return { success: true, message: 'Firebase Admin SDK não necessário para o sistema de DB atual.' };
  }

  if (admin.apps.length > 0) {
    console.log('[Admin Script] Firebase Admin SDK já inicializado.');
    const app = admin.apps[0]!;
    dbAdminInstance = app.firestore();
    authAdminInstance = app.auth();
    return { success: true, message: 'Admin SDK já estava inicializado.' };
  }

  console.log('[Admin Script] Initializing Firebase Admin SDK...');
  let serviceAccount;
  const currentCwd = process.cwd();
  const manualPath = path.join(currentCwd, serviceAccountKeyFileName);

  if (fs.existsSync(manualPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
    } catch (e: any) {
      console.error(`[Admin Script] Falha ao ler/parsear chave de serviço de ${manualPath}: ${e.message}`);
      return { success: false, message: `Falha ao carregar chave de serviço: ${e.message}` };
    }
  } else {
    console.error(`[Admin Script] Arquivo de chave de serviço NÃO ENCONTRADO em: ${manualPath}`);
    return { success: false, message: `Arquivo de chave de serviço não encontrado em ${manualPath}` };
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Admin Script] Firebase Admin SDK inicializado com sucesso.');
    dbAdminInstance = app.firestore();
    authAdminInstance = app.auth();
    return { success: true, message: 'Admin SDK inicializado.' };
  } catch (error: any) {
    console.error('[Admin Script] ERRO CRÍTICO durante inicialização do Admin SDK:', error);
    return { success: false, message: `Erro ao inicializar Admin SDK: ${error.message}` };
  }
}

async function getRoleByNameFromDb(roleName: string): Promise<Role | null> {
  try {
    const dbAdapter = await getDatabaseAdapter();
    return dbAdapter.getRoleByName(roleName);
  } catch (error: any) {
    console.error(`[Admin Script] Erro ao buscar perfil '${roleName}' via adapter:`, error);
    return null;
  }
}


async function setupAdminUser() {
  const activeSystem = process.env.ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'MYSQL';
  console.log(`[Admin Script] Configurando usuário ${ADMIN_EMAIL} como ${ADMIN_TARGET_ROLE_NAME} para sistema: ${activeSystem}`);

  const sdkInitResult = await initializeFirebaseAdminSDK();
  if (activeSystem === 'FIRESTORE' && !sdkInitResult.success) {
    console.error(`[Admin Script] Falha ao inicializar Firebase Admin SDK necessário para o modo FIRESTORE. Mensagem: ${sdkInitResult.message}`);
    process.exit(1);
  }

  try {
    const adminRole = await getRoleByNameFromDb(ADMIN_TARGET_ROLE_NAME);
    if (!adminRole || !adminRole.id) {
      console.error(`[Admin Script] Perfil '${ADMIN_TARGET_ROLE_NAME}' não encontrado ou sem ID. Execute db:init ou seed de perfis primeiro.`);
      // Tentar garantir que os perfis padrão existam
      const dbAdapter = await getDatabaseAdapter();
      await dbAdapter.ensureDefaultRolesExist();
      const adminRoleAfterEnsure = await getRoleByNameFromDb(ADMIN_TARGET_ROLE_NAME);
      if(!adminRoleAfterEnsure || !adminRoleAfterEnsure.id){
        console.error(`[Admin Script] CRÍTICO: Perfil '${ADMIN_TARGET_ROLE_NAME}' ainda não encontrado após ensure. Saindo.`);
        process.exit(1);
      }
      console.log(`[Admin Script] Perfil '${ADMIN_TARGET_ROLE_NAME}' encontrado/criado após ensure.`);
    }

    let userIdToUse: string;
    let userExistsInAuth = false;

    if (activeSystem === 'FIRESTORE') {
      if (!authAdminInstance) {
         console.error('[Admin Script] Instância do Firebase Auth Admin não está disponível para FIRESTORE.');
         process.exit(1);
      }
      let userRecord;
      try {
        userRecord = await authAdminInstance.getUserByEmail(ADMIN_EMAIL);
        userExistsInAuth = true;
        userIdToUse = userRecord.uid;
        console.log(`[Admin Script] Usuário encontrado no Firebase Auth com UID: ${userIdToUse}`);
        await authAdminInstance.updateUser(userIdToUse, { password: ADMIN_PASSWORD, displayName: ADMIN_FULL_NAME });
        console.log(`[Admin Script] Senha e nome do usuário Auth ${ADMIN_EMAIL} atualizados (se necessário).`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log(`[Admin Script] Usuário ${ADMIN_EMAIL} não encontrado no Firebase Auth. Criando...`);
          try {
            userRecord = await authAdminInstance.createUser({
              email: ADMIN_EMAIL,
              emailVerified: true,
              password: ADMIN_PASSWORD,
              displayName: ADMIN_FULL_NAME,
              disabled: false,
            });
            userIdToUse = userRecord.uid;
            console.log(`[Admin Script] Usuário criado no Firebase Auth com UID: ${userIdToUse}`);
          } catch (createError: any) {
            console.error(`[Admin Script] Erro ao criar usuário ${ADMIN_EMAIL} no Auth:`, createError);
            process.exit(1);
          }
        } else {
          console.error(`[Admin Script] Erro ao verificar usuário ${ADMIN_EMAIL} no Auth:`, error);
          process.exit(1);
        }
      }
    } else { 
      userIdToUse = ADMIN_UID_FOR_SQL; 
      console.log(`[Admin Script] Usando UID '${userIdToUse}' para sistema SQL.`);
    }
    
    console.log(`[Admin Script] Garantindo perfil no banco de dados para UID: ${userIdToUse}, Email: ${ADMIN_EMAIL}, Role: ${ADMIN_TARGET_ROLE_NAME}`);
    const profileResult = await ensureUserProfileInDb(
      userIdToUse,
      ADMIN_EMAIL,
      ADMIN_FULL_NAME,
      ADMIN_TARGET_ROLE_NAME, 
      { password: ADMIN_PASSWORD } 
    );

    if (profileResult.success) {
      console.log(`[Admin Script] Perfil para ${ADMIN_EMAIL} (UID: ${userIdToUse}) configurado com sucesso no banco de dados com o perfil ${ADMIN_TARGET_ROLE_NAME}.`);
    } else {
      console.error(`[Admin Script] Falha ao configurar perfil no banco de dados para ${ADMIN_EMAIL}: ${profileResult.message}`);
       if (activeSystem === 'FIRESTORE' && authAdminInstance && !userExistsInAuth && userIdToUse) {
           try {
               await authAdminInstance.deleteUser(userIdToUse);
               console.log(`[Admin Script] Criação do usuário Auth ${userIdToUse} revertida devido a falha no DB.`);
           } catch (deleteError) {
               console.error(`[Admin Script] Falha ao reverter usuário Auth ${userIdToUse}. Limpeza manual pode ser necessária.`, deleteError);
           }
       }
    }
    console.log(`[Admin Script] Configuração para ${ADMIN_EMAIL} como ${ADMIN_TARGET_ROLE_NAME} concluída.`);
  } catch (error: any) {
    console.error(`[Admin Script] Erro durante a configuração do usuário administrador para ${ADMIN_EMAIL}:`, error);
    process.exit(1);
  }
}

setupAdminUser().then(() => {
    console.log("[Admin Script] Processo finalizado.");
    process.exit(0);
}).catch(err => {
    console.error("[Admin Script] Erro não tratado no setupAdminUser:", err);
    process.exit(1);
});

    