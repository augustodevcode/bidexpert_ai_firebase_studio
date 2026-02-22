/**
 * @fileoverview Vercel Blob Storage Adapter — upload via @vercel/blob.
 * Requer BLOB_READ_WRITE_TOKEN no environment. Usado em produção Vercel.
 *
 * Folders por ambiente (detectados via subdomain no Host header):
 *   demo/ → demo.storage.bidexpert.vercel/
 *   hml/  → hml.storage.bidexpert.vercel/
 *   prd/  → prd.storage.bidexpert.vercel/
 *
 * O store BLOB_READ_WRITE_TOKEN é compartilhado; a segregação é feita pelo
 * prefixo de pasta no pathname do blob (ex: demo/media/uuid-file.jpg).
 */
import { v4 as uuidv4 } from 'uuid';
import type { StorageAdapter, UploadResult } from './index';

type EnvPrefix = 'demo' | 'hml' | 'prd' | 'dev';

export class VercelBlobAdapter implements StorageAdapter {
  private readonly envPrefix: EnvPrefix;

  constructor(envPrefix: EnvPrefix = 'demo') {
    this.envPrefix = envPrefix;
  }

  async upload(
    file: Buffer,
    fileName: string,
    uploadPath: string,
    mimeType: string
  ): Promise<UploadResult> {
    const { put } = await import('@vercel/blob');
    const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const unique = `${uuidv4()}-${sanitized}`;
    // Exemplo de path: demo/media/uuid-file.jpg → segregado por ambiente
    const blobPath = `${this.envPrefix}/${uploadPath}/${unique}`;

    const { url } = await put(blobPath, file, {
      access: 'public',
      contentType: mimeType,
    });

    return {
      url,
      storagePath: blobPath,
      thumbnailUrl: url,
      mediumUrl: url,
      largeUrl: url,
    };
  }

  async delete(storagePath: string): Promise<void> {
    try {
      const { del } = await import('@vercel/blob');
      // storagePath pode ser o blobPath (demo/media/uuid.jpg) ou a URL completa
      await del(storagePath);
    } catch (error) {
      console.warn(`[VercelBlobAdapter] Could not delete blob: ${storagePath}`, error);
    }
  }

  getUrl(storagePath: string): string {
    // Vercel Blob retorna URLs absolutas no upload; storagePath é o blobPath relativo
    // Para reconstruir a URL, confiamos na URL armazenada no banco (storagePath=url)
    return storagePath;
  }
}
