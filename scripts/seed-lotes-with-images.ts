// scripts/seed-lotes-with-images.ts
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util'; // Para usar fs.readdir, fs.stat de forma assíncrona

// Importa a instância centralizada do Admin SDK e Firestore
// Isso garante que o SDK seja inicializado e dbAdmin esteja disponível
import { dbAdmin } from '../src/lib/firebase/admin';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

// Caminho base para as imagens de exemplo locais copiadas para o diretório 'public'
const IMAGES_BASE_PATH = '/home/user/studio/public/lotes-exemplo';

// Caminho base público para acessar as imagens no front-end
const PUBLIC_IMAGE_BASE_URL = '/lotes-exemplo';

// Extensões de arquivo de imagem a procurar
const IMAGE_EXTENSIONS = ['.jpg', '.png', '.jpeg', '.webp', '.avif'];

// Nome da coleção de lotes no Firestore
const LOTES_COLLECTION = 'lots';

// Nome do campo no documento do lote onde os URLs das imagens serão armazenados
const IMAGE_URLS_FIELD = 'galleryImageUrls';

// ============================================================================
// PROMESSAS para funções assíncronas de fs
// ============================================================================
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

// Função para listar recursivamente todos os arquivos em um diretório
async function listFilesRecursive(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = await readdir(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = await stat(filePath);

        if (fileStat.isDirectory()) {
            await listFilesRecursive(filePath, fileList); // Recursão para subdiretórios
        } else {
            // Adiciona o arquivo se for uma extensão de imagem permitida
            if (IMAGE_EXTENSIONS.some(ext => filePath.toLowerCase().endsWith(ext))) {
                fileList.push(filePath);
            }
        }
    }

    return fileList;
}


// Função principal para popular lotes com imagens
async function seedLotesWithImages() {
    console.log('--- Iniciando Seed de Lotes com Imagens ---');

    try {
        // 1. Listar arquivos de imagem locais na pasta pública
        console.log(`Buscando imagens locais em ${IMAGES_BASE_PATH}...`);
        const imageFiles = await listFilesRecursive(IMAGES_BASE_PATH);
        console.log(`Encontradas ${imageFiles.length} imagens locais.`);

        if (imageFiles.length === 0) {
            console.log('Nenhuma imagem encontrada. Saindo.');
            return;
        }

        // 2. Gerar URLs públicos relativos
        const imageUrls: string[] = [];
        const publicDir = '/home/user/studio/public'; // Caminho do diretório public

        for (const imageFile of imageFiles) {
            // Calcula o caminho relativo da imagem em relação ao diretório public
            const relativeToPublic = path.relative(publicDir, imageFile);
            // Forma o URL público relativo, garantindo que use '/' como separador de URL
            const publicUrl = '/' + relativeToPublic.replace(/\\/g, '/');

            imageUrls.push(publicUrl);
            console.log(`Gerado URL: ${publicUrl}`);
        }

        console.log(`Gerados ${imageUrls.length} URLs públicos.`);

        if (imageUrls.length === 0) {
             console.log('Nenhum URL de imagem gerado. Saindo.');
            return;
        }
        // 3. Listar lotes no Firestore
        console.log(`Buscando lotes na coleção "${LOTES_COLLECTION}"...`);
        const lotesRef = dbAdmin.collection(LOTES_COLLECTION);
        const lotesSnapshot = await lotesRef.get();

        if (lotesSnapshot.empty) {
            console.log(`Nenhum lote encontrado na coleção "${LOTES_COLLECTION}". Saindo.`);
            return;
        }
        console.log(`Encontrados ${lotesSnapshot.size} lotes.`);

        // 4. Atualizar lotes com URLs de imagem (aleatoriamente, uma imagem por lote)
        console.log(`Associando URLs de imagens aos lotes...`);
        const updatePromises: Promise<FirebaseFirestore.WriteResult>[] = [];
        let imageFilesIndex = 0; // Para pegar arquivos em sequência ou randomizar
        let imageUrlsIndex = 0; // Para pegar URLs em sequência ou randomizar

        lotesSnapshot.forEach(doc => {
             if (imageUrls.length === 0) {
                console.warn(`Sem URLs de imagem restantes para o lote ${doc.id}.`);
                return;
            }

            // Seleciona uma imagem aleatória da lista de URLs públicos
             const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
            // Ou seleciona em sequência (menos aleatório, mas usa todas as imagens se houver mais lotes)
            // const sequentialImageUrl = imageUrls[imageUrlsIndex % imageUrls.length];
            const updateData: any = {};
            // Armazena em um array para o campo imageUrls
            updateData[IMAGE_URLS_FIELD] = [randomImageUrl]; // Associando como array com 1 imagem

            console.log(`Atualizando lote ${doc.id} com URL: ${randomImageUrl}`);
            updatePromises.push(doc.ref.update(updateData));
        });

        // Espera todas as atualizações de lote serem concluídas
        await Promise.all(updatePromises);

        console.log(`Atualização de ${updatePromises.length} lotes concluída.`);

    } catch (error) {
        console.error('Erro durante o seed de lotes com imagens:', error);
    }

    console.log('--- Fim do Seed de Lotes com Imagens ---');
}

// Executa a função principal
// Adicione .catch() para tratar erros na execução inicial assíncrona
seedLotesWithImages();