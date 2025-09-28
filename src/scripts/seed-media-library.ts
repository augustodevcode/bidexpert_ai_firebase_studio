// scripts/seed-media-library.ts
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { MediaService } from '../services/media.service';
import type { MediaItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Promisify fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

const MEDIA_SOURCE_DIR = path.join(process.cwd(), 'public', 'uploads', 'media');
const PUBLIC_BASE_PATH = '/uploads/media';

async function seedMediaLibrary() {
  console.log('--- Iniciando Seed da Biblioteca de Mídia ---');
  console.log(`Buscando arquivos em: ${MEDIA_SOURCE_DIR}`);

  try {
    const mediaService = new MediaService();

    if (!fs.existsSync(MEDIA_SOURCE_DIR)) {
      console.warn(`Diretório de mídia não encontrado em ${MEDIA_SOURCE_DIR}. Nenhum arquivo para processar.`);
      return;
    }

    const fileNames = await readdir(MEDIA_SOURCE_DIR);
    console.log(`Encontrados ${fileNames.length} arquivos/diretórios.`);

    let processedCount = 0;
    for (const fileName of fileNames) {
      const filePath = path.join(MEDIA_SOURCE_DIR, fileName);
      const fileStat = await stat(filePath);

      if (fileStat.isDirectory()) {
        console.log(`Ignorando diretório: ${fileName}`);
        continue;
      }
      
      const publicUrl = `${PUBLIC_BASE_PATH}/${fileName}`;
      const storagePath = publicUrl; // For local storage adapter
      
      // Check if this file already exists in the database by storagePath
      const mediaItems = await mediaService.getMediaItems();
      const existingItem = mediaItems.find(item => item.storagePath === storagePath);

      if (existingItem) {
          console.log(`Item já existe no banco de dados para o arquivo: ${fileName}. Ignorando.`);
          continue;
      }

      console.log(`Processando novo arquivo: ${fileName}`);

      const mediaItemData: Partial<Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>> = {
        fileName: fileName,
        storagePath: storagePath,
        title: path.basename(fileName, path.extname(fileName)).replace(/[-_]/g, ' '),
        altText: path.basename(fileName, path.extname(fileName)).replace(/[-_]/g, ' '),
        mimeType: `image/${path.extname(fileName).slice(1)}`, // Simple assumption for now
        sizeBytes: fileStat.size,
        linkedLotIds: [],
        dataAiHint: 'imagem semeada',
      };
      
      const result = await mediaService.createMediaItem(mediaItemData, publicUrl, 'system-seed');

      if (result.success) {
        console.log(`  - Sucesso: Arquivo "${fileName}" adicionado à biblioteca de mídia.`);
        processedCount++;
      } else {
        console.error(`  - Falha ao adicionar "${fileName}": ${result.message}`);
      }
    }
    
    console.log(`--- Seed da Biblioteca de Mídia concluído. ${processedCount} novos itens adicionados. ---`);

  } catch (error) {
    console.error('Erro crítico durante o seed da biblioteca de mídia:', error);
  } finally {
    // In a real scenario with a persistent DB connection pool, you might want to close it here.
    // For now, we assume the script will exit.
    process.exit(0);
  }
}

seedMediaLibrary();