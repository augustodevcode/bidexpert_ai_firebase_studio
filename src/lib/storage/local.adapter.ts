/**
 * @fileoverview Local File System Storage Adapter — salva em public/uploads/.
 * Usado em desenvolvimento local (DEV). Não é otimizado para produção.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { StorageAdapter, UploadResult } from './index';

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir = path.join(process.cwd(), 'public', 'uploads');

  async upload(
    file: Buffer,
    fileName: string,
    uploadPath: string,
    mimeType: string
  ): Promise<UploadResult> {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const uniqueName = `${baseName}-${uuidv4()}${ext}`;
    const subDir = path.join(this.uploadDir, uploadPath);
    const filePath = path.join(subDir, uniqueName);

    try {
      // Create directory if it doesn't exist
      await fs.mkdir(subDir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, file);

      // Return public URL
      const relativeUrl = `/uploads/${uploadPath}/${uniqueName}`;

      return {
        url: relativeUrl,
        storagePath: filePath,
        thumbnailUrl: relativeUrl,
        mediumUrl: relativeUrl,
        largeUrl: relativeUrl,
      };
    } catch (error) {
      console.error(`[LocalStorageAdapter] Upload failed for ${fileName}:`, error);
      throw new Error(`Failed to save file: ${(error as Error).message}`);
    }
  }

  async delete(storagePath: string): Promise<void> {
    try {
      // storagePath is the full filesystem path
      await fs.unlink(storagePath);
    } catch (error) {
      // Ignore "file not found" errors
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`[LocalStorageAdapter] Delete failed: ${storagePath}`, error);
      }
    }
  }

  getUrl(storagePath: string): string {
    // storagePath contains the relative public URL or the full path
    // If it starts with '/', it's already a public URL
    if (storagePath.startsWith('/')) {
      return storagePath;
    }
    // Otherwise, it might be a full filesystem path, extract the relative part
    const relative = storagePath.replace(process.cwd(), '').replace(/\\/g, '/');
    return relative.startsWith('/') ? relative : `/${relative}`;
  }
}
