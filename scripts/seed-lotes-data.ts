// scripts/seed-lotes-data.ts
import { dbAdmin } from '../src/lib/firebase/admin';
import { sampleLots } from '../src/lib/sample-data'; // Assuming sampleLots is exported from here

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

// Nome da coleção de lotes no Firestore
const LOTES_COLLECTION = 'lotes';

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function seedLotesData() {
    console.log('--- Iniciando Seed de Dados Básicos de Lotes no Firestore ---');

    if (!dbAdmin) {
        console.error('Erro: Firebase Admin SDK (dbAdmin) não está inicializado.');
        console.error('Verifique se o arquivo de chave de serviço existe e o caminho está correto em src/lib/firebase/admin.ts.');
        return;
    }

    const lotesCollectionRef = dbAdmin.collection(LOTES_COLLECTION);

    console.log(`Encontrados ${sampleLots.length} lotes de exemplo.`);

    for (const lot of sampleLots) {
        // Cria uma cópia dos dados do lote e remove o campo de imagens
        const lotDataWithoutImages = { ...lot };
        delete (lotDataWithoutImages as any).galleryImageUrls;

        console.log(`Adicionando lote com ID: ${lot.id}`);
        try {
            await lotesCollectionRef.doc(lot.id).set(lotDataWithoutImages);
            console.log(`Lote ${lot.id} adicionado/atualizado com sucesso.`);
        } catch (error) {
            console.error(`Erro ao adicionar lote ${lot.id}:`, error);
        }
    }

    console.log('--- Fim do Seed de Dados Básicos de Lotes no Firestore ---');
}

seedLotesData();