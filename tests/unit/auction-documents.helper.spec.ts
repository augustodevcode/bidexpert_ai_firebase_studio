/**
 * @fileoverview Cobre os helpers de normalizacao de documentos publicos de leilao.
 */

import { describe, expect, it } from 'vitest';

import {
  getAuctionDocumentLabel,
  getPrimaryAuctionDocument,
  getPublicAuctionDocuments,
} from '../../src/lib/auctions/documents';

describe('auction-documents helper', () => {
  it('returns sorted and public documents from normalized relation payload', () => {
    const documents = getPublicAuctionDocuments({
      documents: [
        {
          id: 'doc-2',
          auctionId: 'auction-1',
          tenantId: 'tenant-1',
          fileName: 'certidao.pdf',
          title: 'Certidao',
          description: null,
          fileUrl: 'https://cdn.bidexpert.com.br/docs/certidao.pdf',
          fileSize: 1000n,
          mimeType: 'application/pdf',
          displayOrder: 2,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'doc-1',
          auctionId: 'auction-1',
          tenantId: 'tenant-1',
          fileName: 'edital.pdf',
          title: 'Edital',
          description: null,
          fileUrl: 'https://cdn.bidexpert.com.br/docs/edital.pdf',
          fileSize: 2000n,
          mimeType: 'application/pdf',
          displayOrder: 1,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'doc-private',
          auctionId: 'auction-1',
          tenantId: 'tenant-1',
          fileName: 'interno.pdf',
          title: 'Interno',
          description: null,
          fileUrl: 'https://cdn.bidexpert.com.br/docs/interno.pdf',
          fileSize: 500n,
          mimeType: 'application/pdf',
          displayOrder: 0,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any,
    });

    expect(documents.map((document) => document.id)).toEqual(['doc-1', 'doc-2']);
    expect(getPrimaryAuctionDocument({ documents: documents as any })?.id).toBe('doc-1');
  });

  it('falls back to legacy URLs when relation documents are missing', () => {
    const documents = getPublicAuctionDocuments({
      documentsUrl: 'https://cdn.bidexpert.com.br/docs/edital.pdf',
      evaluationReportUrl: 'https://cdn.bidexpert.com.br/docs/laudo.pdf',
      auctionCertificateUrl: 'https://cdn.bidexpert.com.br/docs/matricula.pdf',
    } as any);

    expect(documents).toHaveLength(3);
    expect(documents[0]?.title).toContain('Edital');
    expect(documents[1]?.title).toContain('Laudo');
    expect(documents[2]?.title).toContain('Certidão');
  });

  it('builds sensible labels when title and filename are missing', () => {
    expect(getAuctionDocumentLabel({ title: '  Edital oficial  ' }, 0)).toBe('Edital oficial');
    expect(getAuctionDocumentLabel({ fileName: 'arquivo_teste.pdf' }, 1)).toBe('arquivo_teste.pdf');
    expect(getAuctionDocumentLabel({}, 2)).toBe('Documento 3');
  });
});
