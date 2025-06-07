// scripts/seed-lotes-with-images.ts
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util'; // Para usar fs.readdir, fs.stat de forma assíncrona

// Importa a instância centralizada do Admin SDK e Firestore
// Isso garante que o SDK seja inicializado e dbAdmin esteja disponível
import { dbAdmin } from '../src/lib/firebase/admin';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

// Caminho base para as imagens de exemplo locais
const IMAGES_BASE_PATH = '/home/user/studio/CadastrosExemplo';

// Caminho de destino dentro do seu bucket do Firebase Storage
const STORAGE_DESTINATION_PATH = '/home/user/studio/CadastrosExemplo/lotes-exemplo/';

// Extensões de arquivo de imagem a procurar
const IMAGE_EXTENSIONS = ['.jpg', '.png', '.jpeg', '.webp', '.avif'];

// Nome da coleção de lotes no Firestore
const LOTES_COLLECTION = 'lotes';

// Nome do campo no documento do lote onde os URLs das imagens serão armazenados
const IMAGE_URLS_FIELD = 'imageUrls';

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

// Função para fazer upload de um arquivo para o Firebase Storage
async function uploadFileToStorage(localFilePath: string, destinationPath: string): Promise<string> {
    const bucket = admin.storage().bucket(); // Obtém o bucket padrão
    const filename = path.basename(localFilePath);
    const destination = `${destinationPath}${filename}`; // Caminho completo no Storage

    console.log(`Fazendo upload de ${localFilePath} para ${destination}...`);

    await bucket.upload(localFilePath, {
        destination: destination,
        metadata: {
            // Metadados opcionais
            contentType: `image/${path.extname(localFilePath).substring(1)}`, // Tenta inferir content type
        },
    });

    // Obtém o URL de download público (não assinado)
    // IMPORTANTE: Regras de segurança do Storage devem permitir leitura pública ou use URLs assinados
    const file = bucket.file(destination);
    // Use getDownloadURL se suas regras permitem acesso sem token ou se você quer o token no URL
    // Para URLs públicos sem token, pode ser necessário configurar o bucket para servir conteúdo público
    // Para URLs seguros e temporários, use getSignedUrl
     const [url] = await file.getSignedUrl({
         action: 'read',
         expires: '03-09-2491', // Data de expiração bem no futuro para URLs de seeding
     });
     // Ou use getDownloadURL se as regras permitirem acesso público direto (menos recomendado para dados sensíveis)
    // const [url] = await file.getDownloadURL();


    console.log(`Upload concluído. URL: ${url}`);
    return url;
}

// Função principal para popular lotes com imagens
async function seedLotesWithImages() {
    console.log('--- Iniciando Seed de Lotes com Imagens ---');

    try {
        // 1. Listar arquivos de imagem locais
        console.log(`Buscando imagens em ${IMAGES_BASE_PATH}...`);
        const imageFiles = await listFilesRecursive(IMAGES_BASE_PATH);
        console.log(`Encontradas ${imageFiles.length} imagens.`);

        if (imageFiles.length === 0) {
            console.log('Nenhuma imagem encontrada. Saindo.');
            return;
        }

        // 2. Fazer upload das imagens e obter URLs
        console.log('Fazendo upload das imagens para o Firebase Storage...');
        const imageUrls: string[] = [];
        for (const imageFile of imageFiles) {
            try {
                const url = await uploadFileToStorage(imageFile, STORAGE_DESTINATION_PATH);
                imageUrls.push(url);
            } catch (uploadError) {
                console.error(`Falha no upload da imagem ${imageFile}:`, uploadError);
                // Continue mesmo se o upload de uma imagem falhar
            }
        }
        console.log(`Upload concluído para ${imageUrls.length} imagens.`);

        if (imageUrls.length === 0) {
             console.log('Nenhum URL de imagem obtido com sucesso após upload. Saindo.');
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
        let imageUrlsIndex = 0; // Para pegar URLs em sequência ou randomizar

        lotesSnapshot.forEach(doc => {
             if (imageUrls.length === 0) {
                console.warn(`Sem URLs de imagem restantes para o lote ${doc.id}.`);
                return;
            }

            // Seleciona uma imagem aleatória da lista
             const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

            // Ou seleciona em sequência (menos aleatório, mas usa todas as imagens se houver mais lotes)
            // const sequentialImageUrl = imageUrls[imageUrlsIndex % imageUrls.length];
            // imageUrlsIndex++; // Incrementar para sequência


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
seedLotesWithImages();