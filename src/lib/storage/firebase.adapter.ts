
// src/lib/storage/firebase.adapter.ts
import type { IStorageAdapter } from '@/types';
import { ensureAdminInitialized } from '@/lib/firebase/admin';

export class FirebaseStorageAdapter implements IStorageAdapter {
  private bucketName?: string;

  constructor(bucketName?: string) {
    this.bucketName = bucketName;
    console.log(`[FirebaseStorageAdapter] Initialized. Target bucket: ${bucketName || 'default'}`);
  }

  async upload(fileName: string, contentType: string, buffer: Buffer): Promise<{ publicUrl: string; storagePath: string; }> {
    const { storageAdmin, error: sdkError } = ensureAdminInitialized();
    if (sdkError || !storageAdmin) {
      const msg = `Firebase Admin SDK for Storage is not available. ${sdkError?.message || ''}`;
      console.error(`[FirebaseStorageAdapter - upload] ${msg}`);
      throw new Error(msg);
    }
    
    try {
      const bucket = this.bucketName ? storageAdmin.bucket(this.bucketName) : storageAdmin.bucket();
      const storagePath = `media_uploads/${fileName}`;
      const file = bucket.file(storagePath);
      
      await file.save(buffer, {
        metadata: { contentType },
      });

      await file.makePublic();
      const publicUrl = file.publicUrl();

      console.log(`[FirebaseStorageAdapter] File ${fileName} uploaded to ${storagePath} and made public.`);
      return { publicUrl, storagePath };
    } catch (error: any) {
      console.error('[FirebaseStorageAdapter - upload] Error uploading to Firebase Storage:', error);
      throw new Error(`Failed to upload to Firebase Storage: ${error.message}`);
    }
  }

  async delete(storagePath: string): Promise<{ success: boolean; message: string; }> {
    const { storageAdmin, error: sdkError } = ensureAdminInitialized();
    if (sdkError || !storageAdmin) {
      const msg = `Firebase Admin SDK for Storage is not available. ${sdkError?.message || ''}`;
      console.error(`[FirebaseStorageAdapter - delete] ${msg}`);
      return { success: false, message: msg };
    }

    try {
        const bucket = this.bucketName ? storageAdmin.bucket(this.bucketName) : storageAdmin.bucket();
        const file = bucket.file(storagePath);

        // Check if file exists before trying to delete
        const [exists] = await file.exists();
        if (exists) {
            await file.delete();
            console.log(`[FirebaseStorageAdapter] File deleted successfully from ${storagePath}`);
            return { success: true, message: 'Arquivo excluído do Firebase Storage.' };
        } else {
            console.warn(`[FirebaseStorageAdapter - delete] File not found at path: ${storagePath}. Skipping deletion.`);
            return { success: true, message: 'Arquivo não encontrado no Firebase Storage, mas a operação é considerada bem-sucedida.' };
        }
    } catch (error: any) {
        console.error('[FirebaseStorageAdapter - delete] Error deleting from Firebase Storage:', error);
        return { success: false, message: `Falha ao excluir do Firebase Storage: ${error.message}` };
    }
  }
}
