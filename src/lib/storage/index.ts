
// src/lib/storage/index.ts
import type { IStorageAdapter } from '@/types';
import { LocalStorageAdapter } from './local.adapter';
import { FirebaseStorageAdapter } from './firebase.adapter';

let storageInstance: IStorageAdapter | undefined;

export async function getStorageAdapter(): Promise<IStorageAdapter> {
  if (storageInstance) {
    return storageInstance;
  }

  // Configuration MUST come from environment variables to avoid circular dependencies
  // where getting a setting requires a DB adapter, which requires...
  const provider = process.env.STORAGE_PROVIDER?.toUpperCase() || 'LOCAL';
  
  console.log(`[getStorageAdapter] Initializing storage adapter for provider: ${provider}`);

  switch (provider) {
    case 'FIREBASE':
      storageInstance = new FirebaseStorageAdapter();
      break;
    case 'LOCAL':
    default:
      storageInstance = new LocalStorageAdapter();
      break;
  }

  return storageInstance;
}
