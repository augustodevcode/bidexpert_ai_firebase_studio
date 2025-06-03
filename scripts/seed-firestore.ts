
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv'; // Import dotenv
config(); // Load .env file variables

// --- IMPORTANTE: CONFIGURAÇÃO DO FIREBASE ADMIN SDK ---
// 1. Baixe a chave JSON da sua Conta de Serviço do Firebase Admin SDK.
//    Vá para o Console do Firebase > Configurações do Projeto > Contas de serviço > Gerar nova chave privada.
// 2. Armazene esta chave de forma segura FORA do controle de versão do seu projeto.
// 3. Defina a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS para o CAMINHO COMPLETO deste arquivo de chave.
//    OU, para teste local, se GOOGLE_APPLICATION_CREDENTIALS não estiver definida globalmente,
//    você pode criar um arquivo .env na raiz do projeto e adicionar:
//    FIREBASE_ADMIN_SDK_PATH=/caminho/completo/para/seu/serviceAccountKey.json
//    O script tentará usar FIREBASE_ADMIN_SDK_PATH se GOOGLE_APPLICATION_CREDENTIALS não for encontrada.
//    NUNCA FAÇA COMMIT DA CHAVE OU DO CAMINHO DIRETO NO CÓDIGO SE ELE FOR PARA O GIT.

try {
  // Tenta inicializar com GOOGLE_APPLICATION_CREDENTIALS se estiver definida
  admin.initializeApp();
  console.log("Firebase Admin SDK inicializado usando GOOGLE_APPLICATION_CREDENTIALS.");
} catch (error: any) {
  // Se GOOGLE_APPLICATION_CREDENTIALS não estiver definida ou falhar, tenta com o caminho do .env
  const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
  if (serviceAccountPath) {
    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK inicializado usando FIREBASE_ADMIN_SDK_PATH do arquivo .env.");
    } catch (e: any) {
      console.error("Falha ao inicializar Firebase Admin SDK com FIREBASE_ADMIN_SDK_PATH:", e.message);
      console.error("Verifique se o caminho no arquivo .env está correto e o arquivo JSON existe.");
      process.exit(1);
    }
  } else if (error.code === 'app/no-app') {
    // Isso pode acontecer se já foi inicializado em outro lugar, o que é improvável para este script.
    // Ou se GOOGLE_APPLICATION_CREDENTIALS não foi encontrada e FIREBASE_ADMIN_SDK_PATH também não.
     console.warn("Firebase Admin SDK pode já estar inicializado OU GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_ADMIN_SDK_PATH não foram configuradas.", error.message);
     // Se chegar aqui sem inicializar, vai falhar na próxima chamada ao db.
  }
  else {
    console.error("Falha ao inicializar Firebase Admin SDK. Verifique suas credenciais (GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_ADMIN_SDK_PATH).", error);
    process.exit(1);
  }
}

const db = admin.firestore();

// Helper function to slugify text
const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // Normalize to decompose combined graphemes
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

interface IBGEState {
  id: number; // IBGE ID for state
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number; // IBGE ID for city
  nome: string;
}

async function seedData() {
  console.log('Iniciando o processo de seed de Estados e Cidades a partir do IBGE...');

  try {
    // 1. Buscar Estados (UFs)
    console.log('Buscando estados do IBGE...');
    const responseStates = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
    if (!responseStates.ok) {
      throw new Error(`Falha ao buscar estados: ${responseStates.statusText}`);
    }
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
          name: stateName,
          uf: stateUf.toUpperCase(),
          slug: stateSlug,
          cityCount: 0, // Será atualizado conforme as cidades são adicionadas (ou pode ser calculado depois)
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`  Estado ${stateName} (ID: ${stateSlug}) adicionado.`);
      } else {
        console.log(`  Estado ${stateName} (ID: ${stateSlug}) já existe. Pulando criação do estado.`);
      }

      // 2. Para cada Estado, buscar seus Municípios
      console.log(`  Buscando municípios para ${stateName}...`);
      const responseCities = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateUf}/municipios?orderBy=nome`);
      if (!responseCities.ok) {
        console.warn(`    Falha ao buscar municípios para ${stateName}: ${responseCities.statusText}. Pulando cidades para este estado.`);
        continue;
      }
      const citiesFromIBGE: IBGECity[] = await responseCities.json();
      console.log(`    ${citiesFromIBGE.length} municípios encontrados para ${stateName}.`);

      let citiesAddedToThisStateCount = 0;
      for (const ibgeCity of citiesFromIBGE) {
        const cityName = ibgeCity.nome;
        const cityIbgeCode = ibgeCity.id.toString();
        const citySlug = slugify(cityName);
        // Usar um ID de documento previsível para cidades para evitar duplicatas se o script for executado novamente
        const cityDocId = `${stateSlug}-${citySlug}`;
        const cityRef = db.collection('cities').doc(cityDocId);

        const cityDoc = await cityRef.get();
        if (!cityDoc.exists) {
          await cityRef.set({
            name: cityName,
            slug: citySlug,
            stateId: stateSlug, // Referencia o ID (slug) do estado pai
            stateUf: stateUf.toUpperCase(),
            ibgeCode: cityIbgeCode,
            lotCount: 0, // Inicializa a contagem de lotes
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(`      Município ${cityName} (Cód. IBGE: ${cityIbgeCode}, ID: ${cityDocId}) adicionado a ${stateName}.`);
          citiesAddedToThisStateCount++;
        } else {
           // console.log(`      Município ${cityName} (ID: ${cityDocId}) em ${stateName} já existe. Pulando.`);
        }
      }
      // Opcional: Atualizar cityCount no estado se desejar
      // if (citiesAddedToThisStateCount > 0 && stateDoc.exists()) {
      //   await stateRef.update({ cityCount: FieldValue.increment(citiesAddedToThisStateCount), updatedAt: FieldValue.serverTimestamp() });
      //   console.log(`    Contagem de cidades para ${stateName} atualizada.`);
      // }
      console.log(`  Finalizado processamento de municípios para ${stateName}.`);
    }

    console.log('Seed de Estados e Cidades a partir do IBGE concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo de seed:', error);
  }
}

seedData().catch(error => {
  console.error("Erro fatal no script de seed:", error);
});
