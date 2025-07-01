// scripts/rename-lotes-to-lots.ts
import { ensureAdminInitialized } from '../src/lib/firebase/admin';

// ===========================================================================
// CONFIGURAÇÕES
// ===========================================================================

const OLD_COLLECTION = 'lotes';
const NEW_COLLECTION = 'lots';

// ===========================================================================
// FUNÇÃO PRINCIPAL
// ===========================================================================

async function renameCollection() {
    console.log(`--- Iniciando processo de renomear a coleção '${OLD_COLLECTION}' para '${NEW_COLLECTION}' ---`);

    const { db: dbAdmin, error } = ensureAdminInitialized();

    if (!dbAdmin || error) {
        console.error('Erro: Firebase Admin SDK (dbAdmin) não está inicializado.', error?.message);
        console.error('Verifique se o arquivo de chave de serviço existe e o caminho está correto.');
        return;
    }

    try {
        const oldCollectionRef = dbAdmin.collection(OLD_COLLECTION);
        const newCollectionRef = dbAdmin.collection(NEW_COLLECTION);

        // 1. Ler todos os documentos da coleção antiga
        console.log(`Lendo documentos da coleção '${OLD_COLLECTION}'...`);
        const snapshot = await oldCollectionRef.get();

        if (snapshot.empty) {
            console.log(`A coleção '${OLD_COLLECTION}' está vazia. Nada para renomear.`);
            return;
        }

        console.log(`Encontrados ${snapshot.size} documentos em '${OLD_COLLECTION}'.`);

        // 2. Copiar documentos para a nova coleção
        console.log(`Copiando documentos para a coleção '${NEW_COLLECTION}'...`);
        const copyPromises: Promise<FirebaseFirestore.WriteResult>[] = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            // Use set with the original document ID to maintain the ID
            const promise = newCollectionRef.doc(doc.id).set(docData);
            copyPromises.push(promise);
            console.log(`Copiando documento ${doc.id}...`);
        });

        await Promise.all(copyPromises);
        console.log(`Copiados ${copyPromises.length} documentos para '${NEW_COLLECTION}'.`);

        // 3. Excluir documentos da coleção antiga
        // Note: Firestore doesn't have a single command to delete a collection.
        // We must delete documents in batches (or one by one).
        // For simplicity in this script, we'll re-read and delete.
        console.log(`Excluindo documentos da coleção original '${OLD_COLLECTION}'...`);

        // Re-read the documents to be safe, although snapshot should still be valid
        const snapshotToDelete = await oldCollectionRef.get();
        const deletePromises: Promise<FirebaseFirestore.WriteResult>[] = [];

        snapshotToDelete.forEach(doc => {
            const promise = doc.ref.delete();
            deletePromises.push(promise);
            console.log(`Excluindo documento ${doc.id}...`);
        });

        await Promise.all(deletePromises);
        console.log(`Excluídos ${deletePromises.length} documentos de '${OLD_COLLECTION}'.`);

        console.log(`--- Processo de renomear a coleção concluído com sucesso! ---`);

    } catch (error) {
        console.error(`Erro durante o processo de renomear a coleção:`, error);
    }
}

// Executa a função principal
renameCollection();
