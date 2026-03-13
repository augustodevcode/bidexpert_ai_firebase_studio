/**
 * Row type for LotDocument entity.
 */
export interface LotDocumentRow {
  id: string;
  lotId: string;
  lotTitle: string;
  fileName: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  displayOrder: number;
  isPublic: boolean;
  createdAt: string;
}
