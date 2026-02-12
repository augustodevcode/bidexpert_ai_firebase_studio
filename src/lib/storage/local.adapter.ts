/**
 * @fileoverview Local Storage Adapter — salva arquivos no filesystem local.
 * Usado em desenvolvimento. Em produção Vercel, usar VercelBlobAdapter.
 */
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { StorageAdapter, UploadResult } from './index';

export class LocalStorageAdapter implements StorageAdapter {
  private basePath = path.join(process.cwd(), 'public', 'uploads');

  async upload(
    file: Buffer,
    fileName: string,
    uploadPath: string,
    mimeType: string
  ): Promise<UploadResult> {
    const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${uuidv4()}-${sanitized}`;
    const dirPath = path.join(this.basePath, uploadPath);

    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, uniqueName);
    await writeFile(filePath, file);

    const publicUrl = `/uploads/${uploadPath}/${uniqueName}`.replace(/\\/g, '/');

    return {
      url: publicUrl,
      storagePath: publicUrl,
      thumbnailUrl: publicUrl,
      mediumUrl: publicUrl,
      largeUrl: publicUrl,
    };
  }

  async delete(storagePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), 'public', storagePath);
      if (existsSync(fullPath)) {
        await unlink(fullPath);
      }
    } catch (error) {
      console.warn(`[LocalStorageAdapter] Could not delete file: ${storagePath}`, error);
    }
  }

  getUrl(storagePath: string): string {
    return storagePath;
  }
}
