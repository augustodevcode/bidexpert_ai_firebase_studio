/**
 * @fileoverview Tipos de linha para MediaItem — Admin Plus.
 */
export interface MediaItemRow {
  id: string;
  fileName: string;
  storagePath: string;
  urlOriginal: string;
  urlThumbnail?: string | null;
  urlMedium?: string | null;
  urlLarge?: string | null;
  mimeType: string;
  sizeBytes?: number | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  title?: string | null;
  dataAiHint?: string | null;
  uploadedByUserName?: string | null;
  tenantId?: string | null;
  uploadedAt?: string | null;
}
