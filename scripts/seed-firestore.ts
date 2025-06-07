
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore'; 
import { config } from 'dotenv'; 
import { dbAdmin } from '../src/lib/firebase/admin'; // Importa a instância centralizada

config(); 

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
  'auctions:create', 'auctions:read', 'auctions:update', 'auctions:delete', 'auctions:publish', 
  'auctions:manage_own', 'auctions:manage_assigned', 'auctions:read_public',
  'lots:create', 'lots:read', 'lots:update', 'lots:delete', 'lots:manage_own', 'lots:read_public',
  'media:upload', 'media:read', 'media:update', 'media:delete',
  'users:create', 'users:read', 'users:update', 'users:delete', 'users:assign_roles', 'users:manage_habilitation',
  'roles:create', 'roles:read', 'roles:update', 'roles:delete',
  'settings:read', 'settings:update',
  'view_auctions', 'view_lots', 'place_bids', 'view_reports', 'conduct_auctions'
];

const defaultRoles = [
  { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
  { 
    name: 'USER', 
    description: 'Usuário padrão. Pode ver leilões e lotes. Precisa de habilitação para dar lances.', 
    permissions: ['view_auctions', 'view_lots', 'place_bids']
  },
  { 
    name: 'CONSIGNOR', 
    description: 'Comitente com permissão para gerenciar seus próprios leilões e lotes.', 
    permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload', 'media:read'] 
  },
  { 
    name: 'AUCTIONEER', 
    description: 'Leiloeiro com permissão para gerenciar leilões e conduzir pregões.', 
    permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions', 'media:upload', 'media:read'] 
  },
  {
    name: 'AUCTION_ANALYST',
    description: 'Analista de Leilões com permissões para gerenciar cadastros e habilitação de usuários.',
    permissions: [
      'categories:create', 'categories:read', 'categories:update', 'categories:delete',
      'states:create', 'states:read', 'states:update', 'states:delete',
      'cities:create', 'cities:read', 'cities:update', 'cities:delete',
      'auctioneers:read', 'auctioneers:update', 
      'sellers:read', 'sellers:update', 
      'auctions:read', 'auctions:update',
      'lots:read', 'lots:update',
      'users:read', 'users:manage_habilitation', 
      'media:read',
      'view_reports'
    ]
  }
];

async function seedRoles() {
  if (!dbAdmin) {
    console.error("dbAdmin não inicializado no seedRoles. Verifique a inicialização centralizada.");
    return;
  }
  console.log('Iniciando seed de Perfis Padrão...');
  const rolesCollection = dbAdmin.collection('roles');
  for (const roleData of defaultRoles) {
    const roleNameNormalized = roleData.name.toUpperCase();
    const roleQuery = await rolesCollection.where('name_normalized', '==', roleNameNormalized).limit(1).get();
    
    const validPermissions = roleData.permissions.filter(p => predefinedPermissions.includes(p));

    if (roleQuery.empty) {
      await rolesCollection.add({
        ...roleData,
        name_normalized: roleNameNormalized,
        permissions: validPermissions,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`  Perfil "${roleData.name}" criado com ${validPermissions.length} permissões válidas.`);
    } else {
      console.log(`  Perfil "${roleData.name}" já existe.`);
      const roleDoc = roleQuery.docs[0];
      await roleDoc.ref.update({ 
        permissions: validPermissions,
        description: roleData.description,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      console.log(`    Permissões e descrição do perfil "${roleData.name}" atualizadas/verificadas.`);
    }
  }
  console.log('Seed de Perfis Padrão concluído.');
}

async function setupAdminUser() {
  if (!dbAdmin) {
    console.error("dbAdmin não inicializado no setupAdminUser. Verifique a inicialização centralizada.");
    return;
  }
  console.log('Configurando usuário administrador principal...');
  const adminEmail = "augusto.devcode@gmail.com";
  const adminUid = "zdGL4CALTfP0zTFRIt8OnU1B6An1"; 
  const adminFullName = "Augusto (Admin)";

  const adminRoleQuery = await dbAdmin.collection('roles').where('name_normalized', '==', 'ADMINISTRATOR').limit(1).get();
  if (adminRoleQuery.empty) {
    console.error('ERRO CRÍTICO: Perfil ADMINISTRATOR não encontrado. Execute seedRoles primeiro ou verifique sua criação.');
    return;
  }
  const adminRoleDoc = adminRoleQuery.docs[0];
  const adminRoleId = adminRoleDoc.id;
  const adminRoleName = adminRoleDoc.data().name;

  const userDocRef = dbAdmin.collection('users').doc(adminUid);
  const userDoc = await userDocRef.get();

  const userProfileData: any = {
    email: adminEmail,
    fullName: adminFullName,
    roleId: adminRoleId,
    roleName: adminRoleName,
    status: 'ATIVO',
    habilitationStatus: 'HABILITADO', 
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  if (userDoc.exists && userDoc.data()?.role) {
    userProfileData.role = admin.firestore.FieldValue.delete();
  }
   // Set permissions from the admin role if creating or if not present
  if (!userDoc.exists || !userDoc.data()?.permissions || userDoc.data()?.permissions.length === 0) {
    userProfileData.permissions = adminRoleDoc.data().permissions || [];
  }


  if (!userDoc.exists) {
    userProfileData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    userProfileData.uid = adminUid; 
    await userDocRef.set(userProfileData);
    console.log(`  Documento do usuário administrador "${adminEmail}" criado com perfil ADMINISTRATOR e habilitado.`);
  } else {
    const currentData = userDoc.data();
    if (currentData?.roleId !== adminRoleId ||
        currentData?.roleName !== adminRoleName || 
        currentData?.habilitationStatus !== 'HABILITADO' ||
        currentData?.role !== undefined || 
        JSON.stringify(currentData?.permissions || []) !== JSON.stringify(userProfileData.permissions || [])) {
      await userDocRef.update(userProfileData);
      console.log(`  Documento do usuário administrador "${adminEmail}" atualizado com perfil ADMINISTRATOR e habilitado.`);
    } else {
      console.log(`  Usuário administrador "${adminEmail}" já está configurado corretamente.`);
    }
  }
}


async function seedStatesAndCities() {
  if (!dbAdmin) {
    console.error("dbAdmin não inicializado no seedStatesAndCities. Verifique a inicialização centralizada.");
    return;
  }
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
      const stateRef = dbAdmin.collection('states').doc(stateSlug);

      console.log(`Processando Estado: ${stateName} (UF: ${stateUf})`);
      const stateDoc = await stateRef.get();
      if (!stateDoc.exists) {
        await stateRef.set({
          name: stateName, uf: stateUf.toUpperCase(), slug: stateSlug, cityCount: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`  Estado ${stateName} (ID: ${stateSlug}) adicionado.`);
      }

      const responseCities = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateUf}/municipios?orderBy=nome`);
      if (!responseCities.ok) {
        console.warn(`    Falha ao buscar municípios para ${stateName}: ${responseCities.statusText}. Pulando cidades.`);
        continue;
      }
      const citiesFromIBGE: IBGECity[] = await responseCities.json();
      
      let citiesAddedToThisStateCount = 0;
      for (const ibgeCity of citiesFromIBGE) {
        const cityName = ibgeCity.nome;
        const cityIbgeCode = ibgeCity.id.toString();
        const citySlug = slugify(cityName);
        const cityDocId = `${stateSlug}-${citySlug}`; 
        const cityRef = dbAdmin.collection('cities').doc(cityDocId);

        const cityDoc = await cityRef.get();
        if (!cityDoc.exists) {
          await cityRef.set({
            name: cityName, slug: citySlug, stateId: stateSlug, stateUf: stateUf.toUpperCase(),
            ibgeCode: cityIbgeCode, lotCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          citiesAddedToThisStateCount++;
        }
      }
      if (citiesAddedToThisStateCount > 0 && stateDoc.exists) {
        const currentCityCount = stateDoc.data()?.cityCount || 0;
        if (currentCityCount === 0) {
          await stateRef.update({ cityCount: citiesAddedToThisStateCount, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      }
    }
    console.log('Seed de Estados e Cidades concluído.');
  } catch (error) {
    console.error('Erro durante seed de Estados e Cidades:', error);
  }
}

async function main() {
  console.log("Verificando dbAdmin antes de iniciar o seed...");
  if (!dbAdmin) {
    console.error("dbAdmin não está disponível no início do main. Saindo.");
    process.exit(1);
  }
  console.log("dbAdmin disponível. Prosseguindo com o seed.");
  await seedRoles();
  await setupAdminUser();
  await seedStatesAndCities(); 
  console.log('Processo de Seed completo.');
}

main().catch(error => {
  console.error("Erro fatal no script de seed:", error);
});
