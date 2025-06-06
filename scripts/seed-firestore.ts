
import admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import Timestamp
import { config } from 'dotenv'; 
config(); 

try {
  if (admin.apps.length === 0) {
    admin.initializeApp();
    console.log("Firebase Admin SDK inicializado usando GOOGLE_APPLICATION_CREDENTIALS.");
  } else {
    console.log("Firebase Admin SDK já inicializado.");
  }
} catch (error: any) {
  const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
  if (serviceAccountPath && admin.apps.length === 0) { // Verifica se já não foi inicializado
    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK inicializado usando FIREBASE_ADMIN_SDK_PATH.");
    } catch (e: any) {
      console.error("Falha ao inicializar Firebase Admin SDK com FIREBASE_ADMIN_SDK_PATH:", e.message);
      process.exit(1);
    }
  } else if (error.code !== 'app/app-already-exists' && admin.apps.length === 0) {
    console.error("Falha ao inicializar Firebase Admin SDK. Verifique GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_ADMIN_SDK_PATH.", error);
    process.exit(1);
  }
}

const db = admin.firestore();

const slugify = (text: string): string => {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};

interface IBGEState { id: number; sigla: string; nome: string; }
interface IBGECity { id: number; nome: string; }

const predefinedPermissions = [
  'manage_all', 'categories:create', 'categories:read', 'categories:update', 'categories:delete',
  'states:create', 'states:read', 'states:update', 'states:delete',
  'cities:create', 'cities:read', 'cities:update', 'cities:delete',
  'auctioneers:create', 'auctioneers:read', 'auctioneers:update', 'auctioneers:delete',
  'sellers:create', 'sellers:read', 'sellers:update', 'sellers:delete',
  'auctions:create', 'auctions:read', 'auctions:update', 'auctions:delete', 'auctions:publish', 'auctions:manage_own', 'auctions:manage_assigned',
  'lots:create', 'lots:read', 'lots:update', 'lots:delete', 'lots:manage_own',
  'media:upload', 'media:read', 'media:update', 'media:delete',
  'users:create', 'users:read', 'users:update', 'users:delete', 'users:assign_roles',
  'roles:create', 'roles:read', 'roles:update', 'roles:delete',
  'settings:read', 'settings:update',
  'view_auctions', 'view_lots', 'place_bids', 'view_reports', 'conduct_auctions'
];

const defaultRoles = [
  { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
  { name: 'USER', description: 'Usuário padrão com permissões de visualização e lance.', permissions: ['view_auctions', 'view_lots', 'place_bids'] },
  { name: 'CONSIGNOR', description: 'Comitente com permissão para gerenciar seus próprios leilões e lotes.', permissions: ['manage_own_auctions', 'manage_own_lots', 'view_reports', 'media:upload', 'media:read'] },
  { name: 'AUCTIONEER', description: 'Leiloeiro com permissão para gerenciar leilões e conduzir pregões.', permissions: ['manage_assigned_auctions', 'conduct_auctions', 'media:upload', 'media:read'] },
];

async function seedRoles() {
  console.log('Iniciando seed de Perfis Padrão...');
  const rolesCollection = db.collection('roles');
  for (const roleData of defaultRoles) {
    const roleNameNormalized = roleData.name.toUpperCase();
    const roleQuery = await rolesCollection.where('name_normalized', '==', roleNameNormalized).limit(1).get();

    if (roleQuery.empty) {
      await rolesCollection.add({
        ...roleData,
        name_normalized: roleNameNormalized,
        permissions: roleData.permissions.filter(p => predefinedPermissions.includes(p)), // Ensure only valid permissions
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`  Perfil "${roleData.name}" criado.`);
    } else {
      console.log(`  Perfil "${roleData.name}" já existe.`);
      // Opcional: Atualizar permissões se necessário
      const roleDoc = roleQuery.docs[0];
      await roleDoc.ref.update({ 
        permissions: roleData.permissions.filter(p => predefinedPermissions.includes(p)),
        updatedAt: FieldValue.serverTimestamp() 
      });
      console.log(`    Permissões do perfil "${roleData.name}" atualizadas/verificadas.`);
    }
  }
  console.log('Seed de Perfis Padrão concluído.');
}

async function setupAdminUser() {
  console.log('Configurando usuário administrador principal...');
  const adminEmail = "augusto.devcode@gmail.com";
  const adminUid = "zdGL4CALTfP0zTFRIt80nU1B6An1"; // UID obtido da imagem
  const adminFullName = "Augusto (Admin)";

  const adminRoleQuery = await db.collection('roles').where('name_normalized', '==', 'ADMINISTRATOR').limit(1).get();
  if (adminRoleQuery.empty) {
    console.error('ERRO CRÍTICO: Perfil ADMINISTRATOR não encontrado ou não pôde ser criado. Execute seedRoles primeiro.');
    return;
  }
  const adminRoleDoc = adminRoleQuery.docs[0];
  const adminRoleId = adminRoleDoc.id;
  const adminRoleName = adminRoleDoc.data().name;

  const userDocRef = db.collection('users').doc(adminUid);
  const userDoc = await userDocRef.get();

  const userProfileData: any = {
    email: adminEmail,
    fullName: adminFullName,
    roleId: adminRoleId,
    roleName: adminRoleName,
    status: 'ATIVO',
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  // Remover o campo 'role' se existir e for diferente de 'roleName'
  if (userDoc.exists() && userDoc.data()?.role && userDoc.data()?.role !== 'roleName') {
    userProfileData.role = FieldValue.delete();
  }


  if (!userDoc.exists()) {
    userProfileData.createdAt = FieldValue.serverTimestamp();
    await userDocRef.set(userProfileData);
    console.log(`  Documento do usuário administrador "${adminEmail}" criado com perfil ADMINISTRATOR.`);
  } else {
    // Atualiza se o roleId ou roleName for diferente, ou se o campo 'role' antigo existir
    const currentData = userDoc.data();
    if (currentData?.roleId !== adminRoleId || currentData?.roleName !== adminRoleName || currentData?.role) {
      await userDocRef.update(userProfileData);
      console.log(`  Documento do usuário administrador "${adminEmail}" atualizado com perfil ADMINISTRATOR.`);
    } else {
      console.log(`  Usuário administrador "${adminEmail}" já está configurado corretamente.`);
    }
  }
}


async function seedStatesAndCities() {
  console.log('Iniciando o processo de seed de Estados e Cidades a partir do IBGE...');
  try {
    const responseStates = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
    if (!responseStates.ok) throw new Error(`Falha ao buscar estados: ${responseStates.statusText}`);
    const statesFromIBGE: IBGEState[] = await responseStates.json();
    console.log(`${statesFromIBGE.length} estados encontrados.`);

    for (const ibgeState of statesFromIBGE) {
      const stateName = ibgeState.nome;
      const stateUf = ibgeState.sigla;
      const stateSlug = slugify(stateName);
      const stateRef = db.collection('states').doc(stateSlug);

      console.log(`Processando Estado: ${stateName} (UF: ${stateUf})`);
      const stateDoc = await stateRef.get();
      if (!stateDoc.exists) {
        await stateRef.set({
          name: stateName, uf: stateUf.toUpperCase(), slug: stateSlug, cityCount: 0,
          createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`  Estado ${stateName} (ID: ${stateSlug}) adicionado.`);
      } else {
        // console.log(`  Estado ${stateName} (ID: ${stateSlug}) já existe.`);
      }

      const responseCities = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateUf}/municipios?orderBy=nome`);
      if (!responseCities.ok) {
        console.warn(`    Falha ao buscar municípios para ${stateName}: ${responseCities.statusText}. Pulando cidades.`);
        continue;
      }
      const citiesFromIBGE: IBGECity[] = await responseCities.json();
      // console.log(`    ${citiesFromIBGE.length} municípios encontrados para ${stateName}.`);

      let citiesAddedToThisStateCount = 0;
      for (const ibgeCity of citiesFromIBGE) {
        const cityName = ibgeCity.nome;
        const cityIbgeCode = ibgeCity.id.toString();
        const citySlug = slugify(cityName);
        const cityDocId = `${stateSlug}-${citySlug}`;
        const cityRef = db.collection('cities').doc(cityDocId);

        const cityDoc = await cityRef.get();
        if (!cityDoc.exists) {
          await cityRef.set({
            name: cityName, slug: citySlug, stateId: stateSlug, stateUf: stateUf.toUpperCase(),
            ibgeCode: cityIbgeCode, lotCount: 0,
            createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
          });
          // console.log(`      Município ${cityName} adicionado a ${stateName}.`);
          citiesAddedToThisStateCount++;
        }
      }
      // Atualizar contagem de cidades no estado
      if (citiesAddedToThisStateCount > 0 && stateDoc.exists()) {
        const currentCityCount = stateDoc.data()?.cityCount || 0;
        if(currentCityCount === 0){ // Apenas atualiza se for 0 para não somar repetidamente
            await stateRef.update({ cityCount: citiesAddedToThisStateCount, updatedAt: FieldValue.serverTimestamp() });
        }
      }
    }
    console.log('Seed de Estados e Cidades concluído.');
  } catch (error) {
    console.error('Erro durante seed de Estados e Cidades:', error);
  }
}

async function main() {
  await seedRoles();
  await setupAdminUser();
  await seedStatesAndCities(); // Mantém a função original
  console.log('Processo de Seed completo.');
}

main().catch(error => {
  console.error("Erro fatal no script de seed:", error);
});

    