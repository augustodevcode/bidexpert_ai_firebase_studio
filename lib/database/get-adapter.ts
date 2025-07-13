// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
import type { DatabaseAdapter } from '@/types';

let adapterInstance: DatabaseAdapter | null = null;

/**
 * Retorna uma instância singleton do FirestoreAdapter.
 * Em nossa arquitetura atual, o Firestore é a única fonte de dados,
 * então este método sempre retornará o adaptador do Firestore.
 * @returns {DatabaseAdapter} Uma instância do FirestoreAdapter.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  if (!adapterInstance) {
    console.log('[getDatabaseAdapter] Creating new FirestoreAdapter instance.');
    adapterInstance = new FirestoreAdapter();
  }
  return adapterInstance;
};
