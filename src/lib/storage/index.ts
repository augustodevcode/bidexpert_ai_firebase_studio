/**
 * @fileoverview Storage adapter factory e interface pública.
 * Seleciona automaticamente o adapter correto com base no ambiente:
 * - Vercel (BLOB_READ_WRITE_TOKEN presente) → VercelBlobAdapter com prefixo de env por subdomain
 * - Local (dev/test) → LocalStorageAdapter (filesystem public/uploads/)
 *
 * Folders no Vercel Blob por ambiente (subdomínio detectado via Host header):
 *   demo/  → demo.storage.bidexpert.vercel/
 *   hml/   → hml.storage.bidexpert.vercel/
 *   prd/   → prd.storage.bidexpert.vercel/
 *   dev/   → fallback local
 */

export interface UploadResult {
  url: string;
  storagePath: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
}

export interface StorageAdapter {
  /**
   * Faz upload de um arquivo para o storage.
   * @param file        Buffer com o conteúdo do arquivo
   * @param fileName    Nome do arquivo (com extensão)
   * @param uploadPath  Subpasta lógica dentro do backend (ex: 'media', 'documents')
   * @param mimeType    MIME type do arquivo
   */
  upload(file: Buffer, fileName: string, uploadPath: string, mimeType: string): Promise<UploadResult>;

  /**
   * Remove um arquivo do storage a partir do storagePath ou URL.
   */
  delete(storagePath: string): Promise<void>;

  /** Retorna URL pública a partir do storagePath. */
  getUrl(storagePath: string): string;
}

/**
 * Detecta o prefixo de ambiente a partir do Host header.
 * demo.localhost | demo.bidexpert.*   → 'demo'
 * hml.localhost  | hml.bidexpert.*   → 'hml'
 * prd / produção sem prefixo         → 'prd'
 * dev / local sem token              → 'dev' (usa LocalStorageAdapter)
 */
export function detectEnvPrefix(host: string | null | undefined): 'demo' | 'hml' | 'prd' | 'dev' {
  if (!host) return 'dev';
  const sub = host.split('.')[0].toLowerCase();
  if (sub === 'demo') return 'demo';
  if (sub === 'hml') return 'hml';
  if (sub === 'prd' || sub === 'www' || sub === 'bidexpert') return 'prd';
  // bidexpertaifirebasestudio.vercel.app → assume demo por padrão em Vercel preview
  if (host.includes('vercel.app')) return 'demo';
  return 'dev';
}

/**
 * Factory principal. Chamar passando o Host header da request para roteamento correto.
 *
 * @example
 *   const storage = getStorageAdapter(request.headers.get('host'));
 *   const { url, storagePath } = await storage.upload(buffer, file.name, 'media', file.type);
 */
export function getStorageAdapter(host?: string | null): StorageAdapter {
  const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (hasVercelBlob) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { VercelBlobAdapter } = require('./vercel-blob.adapter') as typeof import('./vercel-blob.adapter');
    const envPrefix = detectEnvPrefix(host);
    return new VercelBlobAdapter(envPrefix);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LocalStorageAdapter } = require('./local.adapter') as typeof import('./local.adapter');
  return new LocalStorageAdapter();
}
