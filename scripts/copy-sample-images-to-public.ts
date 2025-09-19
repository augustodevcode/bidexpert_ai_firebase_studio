// scripts/copy-sample-images-to-public.ts
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

// Caminho base para as imagens de exemplo locais (origem)
const IMAGES_SOURCE_PATH = '/home/user/studio/CadastrosExemplo';

// Caminho de destino para as imagens copiadas dentro do diretório 'public'
const IMAGES_DESTINATION_PATH = '/home/user/studio/public/assets/images';

// Extensões de arquivo de imagem a procurar (deve corresponder ao script de seed)
const IMAGE_EXTENSIONS = ['.jpg', '.png', '.jpeg'];

// ============================================================================
// PROMESSAS para funções assíncronas de fs
// ============================================================================
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

// Função para listar recursivamente todos os arquivos em um diretório
async function listFilesRecursive(dir: string, fileList: string[] = []): Promise<string[]> {
    try {
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
    } catch (error) {
        console.error(`Erro ao listar arquivos em ${dir}:`, error);
        // Continue mesmo se houver erro em um diretório
    }
    return fileList;
}

// Função para garantir que um diretório exista, criando-o se necessário
async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') { // Ignora erro se o diretório já existe
            console.error(`Erro ao criar diretório ${dirPath}:`, error);
            throw error; // Lança outros erros
        }
    }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function copySampleImagesToPublic() {
    console.log('--- Iniciando Cópia de Imagens de Exemplo para Pasta Pública ---');

    try {
        // 1. Garantir que o diretório de destino exista
        await ensureDirectoryExists(IMAGES_DESTINATION_PATH);
        console.log(`Diretório de destino (${IMAGES_DESTINATION_PATH}) garantido.`);


        // 2. Listar arquivos de imagem locais na origem
        console.log(`Buscando imagens na origem (${IMAGES_SOURCE_PATH})...`);
        const imageFiles = await listFilesRecursive(IMAGES_SOURCE_PATH);
        console.log(`Encontradas ${imageFiles.length} imagens na origem.`);

        if (imageFiles.length === 0) {
            console.log('Nenhuma imagem encontrada na origem. Saindo.');
            return;
        }

        // 3. Copiar cada imagem para o destino
        console.log(`Copiando imagens para o destino (${IMAGES_DESTINATION_PATH})...`);
        let copiedCount = 0;
        for (const sourceFilePath of imageFiles) {
            try {
                // Calcula o caminho relativo da imagem em relação à pasta de origem
                const relativePath = path.relative(IMAGES_SOURCE_PATH, sourceFilePath);
                // Constrói o caminho de destino completo
                const destinationFilePath = path.join(IMAGES_DESTINATION_PATH, relativePath);

                // Garante que o subdiretório de destino exista
                const destinationDir = path.dirname(destinationFilePath);
                await ensureDirectoryExists(destinationDir);

                // Copia o arquivo
                await copyFile(sourceFilePath, destinationFilePath);
                console.log(`Copiado: ${sourceFilePath} -> ${destinationFilePath}`);
                copiedCount++;

            } catch (copyError) {
                console.error(`Falha ao copiar a imagem ${sourceFilePath}:`, copyError);
                // Continue mesmo se a cópia de uma imagem falhar
            }
        }

        console.log(`Cópia concluída. ${copiedCount} imagens copiadas com sucesso.`);

    } catch (error) {
        console.error('Erro durante a cópia das imagens:', error);
    }

    console.log('--- Fim da Cópia de Imagens ---');
}

// Executa a função principal
copySampleImagesToPublic();