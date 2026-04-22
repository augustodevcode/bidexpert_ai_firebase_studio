/**
 * @fileoverview Helpers para seleção e exibição de documentos públicos de leilão.
 */

import type { Auction, AuctionDocument } from '@/types';

export type AuctionPublicDocument = Pick<
  AuctionDocument,
  'id' | 'fileName' | 'title' | 'description' | 'fileUrl' | 'fileSize' | 'mimeType' | 'displayOrder' | 'isPublic'
>;

type AuctionDocumentsSource = Partial<Pick<Auction,
  | 'documents'
  | 'documentsUrl'
  | 'evaluationReportUrl'
  | 'auctionCertificateUrl'
>> | null | undefined;

function normalizeDocumentUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalized);
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function buildLegacyAuctionDocuments(auction: AuctionDocumentsSource): AuctionPublicDocument[] {
  const legacyEntries = [
    {
      key: 'documents',
      title: 'Edital e documentos do leilão',
      fileName: 'edital-leilao.pdf',
      fileUrl: normalizeDocumentUrl(auction?.documentsUrl),
    },
    {
      key: 'evaluation-report',
      title: 'Laudo de avaliação',
      fileName: 'laudo-avaliacao.pdf',
      fileUrl: normalizeDocumentUrl(auction?.evaluationReportUrl),
    },
    {
      key: 'auction-certificate',
      title: 'Certidão/Matrícula',
      fileName: 'certidao-matricula.pdf',
      fileUrl: normalizeDocumentUrl(auction?.auctionCertificateUrl),
    },
  ];

  return legacyEntries
    .filter((entry): entry is {
      key: string;
      title: string;
      fileName: string;
      fileUrl: string;
    } => !!entry.fileUrl)
    .map((entry, index) => ({
      id: `legacy-${entry.key}-${index + 1}`,
      fileName: entry.fileName,
      title: entry.title,
      description: null,
      fileUrl: entry.fileUrl,
      fileSize: null,
      mimeType: null,
      displayOrder: index,
      isPublic: true,
    }));
}

export function getPublicAuctionDocuments(auction: AuctionDocumentsSource): AuctionPublicDocument[] {
  const relationDocuments = (auction?.documents ?? [])
    .filter((document) => document.isPublic && document.fileUrl?.trim())
    .map((document) => ({
      id: document.id,
      fileName: document.fileName,
      title: document.title,
      description: document.description ?? null,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize ?? null,
      mimeType: document.mimeType ?? null,
      displayOrder: document.displayOrder ?? 0,
      isPublic: document.isPublic,
    }))
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0));

  if (relationDocuments.length > 0) {
    return relationDocuments;
  }

  return buildLegacyAuctionDocuments(auction);
}

export function getAuctionDocumentLabel(document: Partial<Pick<AuctionPublicDocument, 'title' | 'fileName'>>, index: number): string {
  const title = document.title?.trim();
  if (title) {
    return title;
  }

  const fileName = document.fileName?.trim();
  if (fileName) {
    return fileName;
  }

  return `Documento ${index + 1}`;
}

export function getPrimaryAuctionDocument(auction: AuctionDocumentsSource): AuctionPublicDocument | null {
  return getPublicAuctionDocuments(auction)[0] ?? null;
}