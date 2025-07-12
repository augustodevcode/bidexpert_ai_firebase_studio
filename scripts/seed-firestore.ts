// scripts/seed-firestore.ts
import { dbAdmin, ensureAdminInitialized } from '../src/lib/firebase/admin';
import {
  sampleLots,
  sampleAuctions,
  sampleLotCategories, // Nome corrigido para corresponder ao JSON
  sampleUsers,
  sampleRoles,
  sampleAuctioneers,
  sampleSellers,
  sampleStates,
  sampleCities,
  sampleSubcategories,
  sampleDirectSaleOffers,
  sampleDocumentTypes,
  sampleNotifications,
  sampleBids,
  sampleUserWins,
  sampleMediaItems,
  sampleCourts,
  sampleJudicialDistricts,
  sampleJudicialBranches,
  sampleJudicialProcesses,
  sampleBens,
  samplePlatformSettings,
  sampleContactMessages
} from '../src/lib/sample-data';
import type { Role } from '../src/types';

// Renomeado 'categories' para 'lotCategories' para corresponder ao JSON
const collectionsToSeed: { name: string, data: any[] }[] = [
  { name: 'lots', data: sampleLots },
  { name: 'auctions', data: sampleAuctions },
  { name: 'categories', data: sampleLotCategories }, // Usando o nome da coleção como 'categories'
  { name: 'subcategories', data: sampleSubcategories }, // Adicionado
  { name: 'users', data: sampleUsers },
  { name: 'roles', data: sampleRoles },
  { name: 'auctioneers', data: sampleAuctioneers },
  { name: 'sellers', data: sampleSellers },
  { name: 'states', data: sampleStates },
  { name: 'cities', data: sampleCities },
  { name: 'directSales', data: sampleDirectSaleOffers },
  { name: 'documentTypes', data: sampleDocumentTypes },
  { name: 'notifications', data: sampleNotifications },
  { name: 'bids', data: sampleBids },
  { name: 'userWins', data: sampleUserWins },
  { name: 'mediaItems', data: sampleMediaItems },
  { name: 'courts', data: sampleCourts },
  { name: 'judicialDistricts', data: sampleJudicialDistricts },
  { name: 'judicialBranches', data: sampleJudicialBranches },
  { name: 'judicialProcesses', data: sampleJudicialProcesses },
  { name: 'bens', data: sampleBens },
  { name: 'settings', data: [samplePlatformSettings] },
  { name: 'contactMessages', data: sampleContactMessages },
];

async function seedDatabase() {
    console.log("--- Iniciando Seed do Firestore ---");
    
    const { db: dbAdmin, error } = ensureAdminInitialized();
    if (error || !dbAdmin) {
        console.error("Erro: Firebase Admin SDK (dbAdmin) não está inicializado.", error?.message);
        return;
    }

    for (const collection of collectionsToSeed) {
        // Renomeado para uma verificação mais clara
        if (!collection.data || collection.data.length === 0) {
            console.log(`Coleção '${collection.name}' está vazia nos dados de exemplo. Pulando.`);
            continue;
        }
        
        console.log(`Populando coleção: ${collection.name}...`);
        const collectionRef = dbAdmin.collection(collection.name);
        const snapshot = await collectionRef.limit(1).get();

        if (!snapshot.empty) {
            console.log(`Coleção '${collection.name}' já contém dados. Pulando.`);
            continue;
        }

        const batchSize = 400; // Limite do Firestore é 500
        for (let i = 0; i < collection.data.length; i += batchSize) {
            const batch = dbAdmin.batch();
            const chunk = collection.data.slice(i, i + batchSize);
            
            chunk.forEach((item) => {
                // Certifica-se de que cada item tem um 'id' para usar como chave do documento
                const docId = item.id;
                if (!docId) {
                    console.warn(`Item na coleção '${collection.name}' não possui ID e será ignorado.`);
                    return;
                }
                const docRef = collectionRef.doc(docId); 
                batch.set(docRef, item);
            });
            
            await batch.commit();
            console.log(`  - Lote de ${chunk.length} documentos para '${collection.name}' inserido.`);
        }
    }

    console.log("--- Seed do Firestore concluído com sucesso! ---");
}

seedDatabase().catch(console.error);
