
// src/lib/storage/local.adapter.ts
import type { IStorageAdapter } from '@/types';
import fs from 'fs';
import path from 'path';

export class LocalStorageAdapter implements IStorageAdapter {
  private uploadDir: string;
  private publicPath: string;

  constructor() {
    // Path is now self-contained and not dependent on other modules.
    this.publicPath = '/uploads/media/';
    // Ensure the path starts and ends with a slash, but not doubly
    const cleanPublicPath = `/${this.publicPath.replace(/^\/|\/$/g, '')}/`;

    this.uploadDir = path.join(process.cwd(), 'public', cleanPublicPath);

    // Ensures the upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      console.log(`[LocalStorageAdapter] Creating upload directory at: ${this.uploadDir}`);
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    console.log('[LocalStorageAdapter] Initialized. Uploads will be saved to:', this.uploadDir);
  }

  async upload(fileName: string, contentType: string, buffer: Buffer): Promise<{ publicUrl: string; storagePath: string; }> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      const publicUrl = path.join(this.publicPath, fileName).replace(/\\/g, '/');
      const storagePath = publicUrl; // For local, public URL and storage path are the same relative to /public

      console.log(`[LocalStorageAdapter] File saved successfully to ${filePath}`);
      return { publicUrl, storagePath };
    } catch (error: any) {
      console.error("[LocalStorageAdapter - upload] Error saving file:", error);
      throw new Error(`Failed to save file locally: ${error.message}`);
    }
  }

  async delete(storagePath: string): Promise<{ success: boolean; message: string; }> {
    try {
      // storagePath for local is the public path, e.g., /uploads/media/file.jpg
      const filePath = path.join(process.cwd(), 'public', storagePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[LocalStorageAdapter] File deleted successfully from ${filePath}`);
        return { success: true, message: 'Arquivo local excluído com sucesso.' };
      } else {
        console.warn(`[LocalStorageAdapter - delete] File not found at path: ${filePath}`);
        return { success: true, message: 'Arquivo local não encontrado, mas a operação é considerada bem-sucedida.' };
      }
    } catch (error: any) {
      console.error("[LocalStorageAdapter - delete] Error deleting file:", error);
      return { success: false, message: `Falha ao excluir arquivo local: ${error.message}` };
    }
  }
}
