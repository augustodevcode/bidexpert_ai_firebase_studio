/**
 * @fileoverview Storage Adapter Pattern — Abstração para upload de arquivos.
 * Detecta automaticamente o ambiente (Vercel → Blob, local → filesystem)
 * e delega upload/delete/getUrl para o adapter correto.
 * Nunca usar writeFile inline — SEMPRE usar este adapter.
 */

export interface UploadResult {
  url: string;
  storagePath: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
}

export interface StorageAdapter {
  upload(file: Buffer, fileName: string, path: string, mimeType: string): Promise<UploadResult>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string): string;
}

let _adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (_adapter) return _adapter;

  const isVercel = !!process.env.VERCEL || !!process.env.BLOB_READ_WRITE_TOKEN;

  if (isVercel) {
    const { VercelBlobAdapter } = require('./vercel-blob.adapter');
    _adapter = new VercelBlobAdapter();
  } else {
    const { LocalStorageAdapter } = require('./local.adapter');
    _adapter = new LocalStorageAdapter();
  }

  return _adapter;
}

export { LocalStorageAdapter } from './local.adapter';
export { VercelBlobAdapter } from './vercel-blob.adapter';
