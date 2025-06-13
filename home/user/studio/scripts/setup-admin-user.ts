// Manually load environment variables from .env.local
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../../.env.local');
try {
  const envFileContent = readFileSync(envPath, 'utf-8');
  envFileContent.split('\\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (error) { /* Ignore if .env.local doesn't exist */ }

// src/scripts/setup-admin-user.ts
// Este script configura um usuário administrador inicial no banco de dados.

import { getDatabaseAdapter } from '@/lib/database';
import { getRoleByName } from '@/lib/database/utils';
import type { DatabaseSystem, UserProfile, Role } from '@/types';
import { getAuth } from 'firebase-admin/auth'; // Importe apenas se estiver usando Firebase Auth
import { ensureAdminInitialized as ensureFirebaseAdminInitialized } from '@/lib/firebase/admin'; // Importe o helper de inicialização do Firebase Admin


const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123'; // Mantenha seguro em .env.local e nunca comite!
const ACTIVE_DATABASE_SYSTEM = (process.env.ACTIVE_DATABASE_SYSTEM || 'MYSQL') as DatabaseSystem;

async function setupAdminUser() {
  console.log(`[Admin Script] Configurando usuário admin@bidexpert.com.br como ADMINISTRATOR para sistema: ${ACTIVE_DATABASE_SYSTEM}`);

  let adminAuth;
  if (ACTIVE_DATABASE_SYSTEM === 'FIRESTORE') {
     const { authAdmin, error: firebaseError } = ensureFirebaseAdminInitialized();
     if (firebaseError || !authAdmin) {
         console.error(\`[Admin Script] Erro ao inicializar Firebase Admin SDK para Auth: ${firebaseError?.message || 'Erro desconhecido'}\`);
         // Continuar, pois a configuração SQL não depende diretamente do Firebase Auth
     } else {
        adminAuth = authAdmin;
     }
  } else {
      console.log(\`[Admin Script] Sistema de DB não é FIRESTORE. Pulando inicialização do Firebase Admin SDK para Auth/Firestore.\`);
  }


  try {
    const db = await getDatabaseAdapter(); // Use await aqui

    // 1. Buscar o ID da role 'ADMINISTRATOR'
    const adminRole = await getRoleByNameFromDb('ADMINISTRATOR', db);

    if (!adminRole || !adminRole.id) {
      console.error(`[Admin Script] Perfil \'ADMINISTRATOR\' não encontrado ou sem ID. Verifique se os perfis padrão existem.`);
      process.exit(1); // Sair se o perfil admin não for encontrado
    }
    console.log(`[Admin Script] ID da role \'ADMINISTRATOR\' encontrado: ${adminRole.id}`);


    // 2. Criar/Atualizar usuário no Firebase Auth (SE estiver usando Firebase Auth)
    let firebaseAuthUid: string | undefined;
     if (ACTIVE_DATABASE_SYSTEM === 'FIRESTORE' && adminAuth) {
        try {
            const userRecord = await adminAuth.getUserByEmail(ADMIN_EMAIL);
            firebaseAuthUid = userRecord.uid;
            console.log(\`[Admin Script] Usuário ${ADMIN_EMAIL} já existe no Firebase Auth com UID: ${firebaseAuthUid}. Não alterando a senha no Auth.\`);
            // Se o usuário já existe, não atualize a senha programaticamente por segurança.
            // A senha deve ser redefinida pelo console do Firebase Auth ou um fluxo de redefinição de senha.

        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(\`[Admin Script] Usuário ${ADMIN_EMAIL} não encontrado no Firebase Auth. Criando...\`);
                 try {
                    const userRecord = await adminAuth.createUser({
                        email: ADMIN_EMAIL,
                        password: ADMIN_PASSWORD, // Apenas para criação inicial. Considere remover/gerar aleatoriamente em produção e forçar redefinição.
                        displayName: 'Administrador', // Nome padrão, pode ser atualizado no perfil SQL
                        emailVerified: true,
                         // disableUser: false,
                    });
                    firebaseAuthUid = userRecord.uid;
                    console.log(\`[Admin Script] Usuário ${ADMIN_EMAIL} criado no Firebase Auth com UID: ${firebaseAuthUid}.\`);
                 } catch(createError: any) {
                     console.error(\`[Admin Script] Erro ao criar usuário ${ADMIN_EMAIL} no Firebase Auth: \${createError.message}\`, createError);
                     // Decida se quer continuar ou sair. Se o Firebase Auth for crítico, talvez deva sair.
                     // process.exit(1);
                 }
            } else {
                console.error(\`[Admin Script] Erro ao buscar usuário ${ADMIN_EMAIL} no Firebase Auth: \${error.message}\`, error);
                 // Decida se quer continuar ou sair. Se o Firebase Auth for crítico, talvez deva sair.
                 // process.exit(1);
            }
        }
    } else {
         console.log(\`[Admin Script] Não usando Firebase Auth (${ACTIVE_DATABASE_SYSTEM}). Pulando operações no Firebase Auth.\`);
         // Se não usar Firebase Auth, o UID para o perfil SQL pode ser gerado no momento da criação
         // ou pode ser gerado aqui se o adapter SQL esperar um UID pré-definido.
         // Por enquanto, vamos gerar um UUID simples se necessário e não estiver no DB.
         // O adapter SQL deve lidar com a criação do user_profiles com o UID correto.
         firebaseAuthUid = undefined; // Certifica que não usaremos um UID do Auth se não estivermos no modo Firestore
    }


    // 3. Criar/Atualizar perfil do usuário no banco de dados SQL (users table)
    // Primeiro, tentar encontrar o usuário pelo email no banco de dados SQL
    console.log(\`[Admin Script] Buscando perfil de usuário ${ADMIN_EMAIL} no banco de dados SQL...\`);

    let userProfile = await db.getUserProfileByEmail(ADMIN_EMAIL);

    const baseProfileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'password_hash' | 'password_text'> = {
        email: ADMIN_EMAIL,
        fullName: 'Administrador BidExpert', // Nome padrão
        roleId: adminRole.id,
        roleName: adminRole.name,
        isActive: true,
         // Adicione outros campos obrigatórios aqui com valores padrão se necessário
         phone: null, // Exemplo
         registrationNumber: null, // Exemplo
         // ... outros campos
    };


    if (userProfile) {
      console.log(`[Admin Script] Perfil de usuário ${ADMIN_EMAIL} encontrado (ID: ${userProfile.id}). Atualizando...`);
       // Lógica para atualizar o perfil existente
       const updateData: Partial<UserProfile> = {
           ...baseProfileData,
           // Só atualiza password_hash se for diferente ou se o adapter suportar hashing internamente
           // Como o objetivo é armazenar a senha clara por enquanto, apenas a definimos
           password_text: ADMIN_PASSWORD, // Armazenando senha clara
            // password_hash: await hashPassword(ADMIN_PASSWORD), // Se for usar hashing
           updatedAt: new Date(), // Atualiza timestamp de atualização
       };
      await db.updateUserProfile(userProfile.id, updateData);
      console.log(`[Admin Script] Perfil de usuário ${ADMIN_EMAIL} (ID: ${userProfile.id}) atualizado no banco de dados SQL.`);
    } else {
      console.log(`[Admin Script] Perfil de usuário ${ADMIN_EMAIL} não encontrado. Criando novo perfil no banco de dados SQL...`);
        // Lógica para criar um novo perfil
        const newProfileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
            ...baseProfileData,
             // Se o sistema for FIRESTORE e o usuário foi criado no Auth, use o UID do Auth
             // Caso contrário, o adapter SQL deve gerar o ID (que será o UID para a plataforma)
             // Nota: Com SQL, o ID da tabela 'users' servirá como o UID da plataforma.
             // Se você realmente precisa que o UID seja o do Firebase Auth mesmo com DB SQL,
             // a arquitetura precisaria garantir que o usuário é criado no Auth primeiro,
             // e então o UID do Auth é usado como ID na tabela 'users'.
             // Para simplificar agora, com DB SQL, o ID da tabela 'users' será o UID da plataforma.
            password_text: ADMIN_PASSWORD, // Armazenando senha clara
             // password_hash: await hashPassword(ADMIN_PASSWORD), // Se for usar hashing
            createdAt: new Date(), // Define timestamp de criação
            updatedAt: new Date(), // Define timestamp de atualização
        };
       userProfile = await db.createUserProfile(newProfileData as Omit<UserProfile, 'id'>); // O adapter deve gerar o ID
       console.log(`[Admin Script] Novo perfil de usuário ${ADMIN_EMAIL} criado no banco de dados SQL com ID: ${userProfile?.id}.`);

        // Se estiver no modo FIRESTORE e criou o usuário no Auth, agora vincule o UID do Auth ao perfil criado no SQL
        // Embora com o modelo atual (SQL como fonte primária) isso seja menos comum.
        // Se o modelo fosse Auth primário + SQL secundário, aqui você buscaria o perfil SQL pelo UID do Auth.
    }

     console.log(\`[Admin Script] Configuração do usuário admin ${ADMIN_EMAIL} concluída.\`);

  } catch (error: any) {
    console.error('[Admin Script] Erro geral durante a configuração do usuário admin:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    process.exit(1); // Sair com erro
  } finally {
      // Aqui você pode fechar conexões de banco de dados se o adapter as mantiver abertas
      // Por exemplo, se o adapter tiver um método closePool()
      // if (ACTIVE_DATABASE_SYSTEM === 'MYSQL' && db instanceof MySqlAdapter) {
      //    (db as MySqlAdapter).closePool();
      // }
      // if (ACTIVE_DATABASE_SYSTEM === 'POSTGRES' && db instanceof PostgresAdapter) {
      //    (db as PostgresAdapter).closePool();
      // }
  }
}

// Helper para buscar role pelo nome, encapsulando a lógica de adapter
async function getRoleByNameFromDb(roleName: string, dbAdapter: typeof getDatabaseAdapter extends () => Promise<infer T> ? T : never): Promise<Role | undefined> {
    try {
        // Use o adapter para buscar a role. Assumimos que o adapter tem um método getRoleByName
        // que busca na tabela 'roles' pelo campo 'name'.
        // Nota: Este método getRoleByName pode precisar ser implementado ou adaptado
        // nos seus adaptadores (mysql.adapter.ts, postgres.adapter.ts, firestore.adapter.ts).
        // Seus adapters devem ter métodos como `findRoleByName(name: string): Promise<Role | undefined>`.
        // Vamos usar uma chamada genérica que você adaptará no seu adapter.
        // Exemplo:
        // const role = await dbAdapter.findRoleByName(roleName);
        // return role;

        // Ou se a lógica de buscar roleByName já está em um utilitário que usa o adapter:
         const role = await getRoleByName(dbAdapter, roleName); // Assumindo que getRoleByName existe e usa o adapter
         return role;

    } catch (error: any) {
        console.error(`[Admin Script] Erro ao buscar perfil \'${roleName}\' via adapter: ${error.message}`);
        return undefined; // Retorna undefined em caso de erro
    }
}


setupAdminUser();