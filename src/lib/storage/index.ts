/**
 * @fileoverview Storage Adapter Factory — seleciona entre Local (dev) e Vercel Blob (prod).
 * Detecta o ambiente via:
 * 1. BLOB_READ_WRITE_TOKEN ← Vercel Blob (produção)
 * 2. Subdomain do Host header ← Extrai tenant/env (demo/hml/prd/dev)
 * 3. Default: LocalStorageAdapter (dev local)
 */
import { LocalStorageAdapter } from './local.adapter';
import { VercelBlobAdapter } from './vercel-blob.adapter';

export interface UploadResult {
  url: string;
  storagePath: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
}

export interface StorageAdapter {
  upload(
    file: Buffer,
    fileName: string,
    uploadPath: string,
    mimeType: string
  ): Promise<UploadResult>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string): string;
}

/**
 * Detecta o prefixo de ambiente a partir do Host header.
 * Exemplos:
 * - "demo.localhost:9005" → "demo"
 * - "hml.bidexpert.com" → "hml"
 * - "localhost:9005" → "dev" (default)
 * - "bidexpertaifirebasestudio.vercel.app" → "prd" (default para Vercel prod)
 */
function detectEnvPrefix(hostHeader?: string | null): string {
  if (!hostHeader) return 'dev';

  // Match subdomain pattern (e.g., "demo.localhost" → "demo")
  const match = hostHeader.match(/^([a-z0-9-]+)\./);
  if (match) {
    const subdomain = match[1];
    // Validate against known environments
    if (['demo', 'hml', 'prd', 'dev'].includes(subdomain)) {
      return subdomain;
    }
  }

  // If no clear subdomain, check if it's Vercel production
  if (hostHeader.includes('vercel.app') && !hostHeader.includes('preview')) {
    return 'prd';
  }

  // Default to dev
  return 'dev';
}

/**
 * Factory para obter o StorageAdapter apropriado.
 * @param hostHeader Valor do header 'Host' (opcional, usado para detectar env)
 * @returns StorageAdapter (LocalStorageAdapter ou VercelBlobAdapter)
 */
export function getStorageAdapter(hostHeader?: string | null): StorageAdapter {
  // Se tem BLOB_READ_WRITE_TOKEN, usar Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const envPrefix = detectEnvPrefix(hostHeader);
    return new VercelBlobAdapter(envPrefix);
  }

  // Default: Local Storage (desenvolvimento)
  return new LocalStorageAdapter();
}

export { LocalStorageAdapter, VercelBlobAdapter };
