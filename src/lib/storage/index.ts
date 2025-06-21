
// src/lib/storage/index.ts
import type { IStorageAdapter } from '@/types';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { LocalStorageAdapter } from './local.adapter';
import { FirebaseStorageAdapter } from './firebase.adapter';
import { samplePlatformSettings } from '@/lib/sample-data'; // Fallback

let storageInstance: IStorageAdapter | undefined;

export async function getStorageAdapter(): Promise<IStorageAdapter> {
  if (storageInstance) {
    return storageInstance;
  }

  let settings;
  try {
    settings = await getPlatformSettings();
  } catch (error) {
    console.warn("[getStorageAdapter] Could not fetch platform settings from DB, using sample data as fallback. Error:", error);
    settings = samplePlatformSettings;
  }
  
  const provider = settings.storageProvider || 'local';
  console.log(`[getStorageAdapter] Initializing storage adapter for provider: ${provider}`);

  switch (provider) {
    case 'firebase':
      const bucketName = settings.firebaseStorageBucket || undefined;
      storageInstance = new FirebaseStorageAdapter(bucketName);
      break;
    case 'local':
    default:
      storageInstance = new LocalStorageAdapter();
      break;
  }

  return storageInstance;
}
