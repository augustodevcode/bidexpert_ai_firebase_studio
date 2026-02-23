/**
 * @fileoverview Vercel Blob Storage Adapter ÔÇö upload via @vercel/blob.
 * Requer BLOB_READ_WRITE_TOKEN no environment. Usado em produ├º├úo Vercel.
 */
import type { StorageAdapter, UploadResult } from './index';

export class VercelBlobAdapter implements StorageAdapter {
  private envPrefix: string;

  constructor(envPrefix: string = 'dev') {
    this.envPrefix = envPrefix;
  }

  async upload(
    file: Buffer,
    fileName: string,
    uploadPath: string,
    mimeType: string
  ): Promise<UploadResult> {
    const { put } = await import('@vercel/blob');
    const blobPath = `${this.envPrefix}/media/${uploadPath}/${fileName}`;

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
      await del(storagePath);
    } catch (error) {
      console.warn(`[VercelBlobAdapter] Could not delete blob: ${storagePath}`, error);
    }
  }

  getUrl(storagePath: string): string {
    return storagePath;
  }
}
