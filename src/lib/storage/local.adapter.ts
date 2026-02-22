/**
 * @fileoverview Local filesystem storage adapter para ambiente de desenvolvimento.
 * Salva arquivos em public/uploads/{uploadPath}/ e serve via Next.js static files.
 * Usado quando BLOB_READ_WRITE_TOKEN não está definido (dev local / testes).
 */
import path from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { StorageAdapter, UploadResult } from './index';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly publicDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public', 'uploads');
  }

  async upload(
    file: Buffer,
    fileName: string,
    uploadPath: string,
    _mimeType: string
  ): Promise<UploadResult> {
    const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const unique = `${uuidv4()}-${sanitized}`;
    const targetDir = path.join(this.publicDir, uploadPath);

    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    await writeFile(path.join(targetDir, unique), file);

    const publicPath = `/uploads/${uploadPath}/${unique}`;

    return {
      url: publicPath,
      storagePath: publicPath,
      thumbnailUrl: publicPath,
      mediumUrl: publicPath,
      largeUrl: publicPath,
    };
  }

  async delete(storagePath: string): Promise<void> {
    try {
      // storagePath pode ser URL relativa /uploads/... ou caminho absoluto
      const relative = storagePath.startsWith('/uploads/')
        ? storagePath.replace('/uploads/', '')
        : storagePath;
      const absPath = path.join(this.publicDir, relative);
      await unlink(absPath);
    } catch (err) {
      // Arquivo pode já ter sido removido — log sem throw
      console.warn(`[LocalStorageAdapter] Could not delete file: ${storagePath}`, err);
    }
  }

  getUrl(storagePath: string): string {
    // storagePath já é URL pública para LocalStorageAdapter
    return storagePath;
  }
}
