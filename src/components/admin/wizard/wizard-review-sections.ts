/**
 * @fileoverview Helpers puros para montar as seções de revisão final do wizard de leilão.
 */

import type { Auction } from '@/types';
import { getPublicAuctionDocuments } from '@/lib/auctions/documents';

export interface WizardReviewItem {
  label: string;
  value: string;
}

export interface WizardReviewSections {
  support: WizardReviewItem[];
  documents: WizardReviewItem[];
  bidding: WizardReviewItem[];
}

const NOT_INFORMED = 'Não informado';
const NOT_APPLICABLE = 'Não aplicável';

function formatText(value?: string | null): string {
  if (typeof value !== 'string') {
    return NOT_INFORMED;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : NOT_INFORMED;
}

function formatToggle(value?: boolean | null, enabledLabel = 'Ativado', disabledLabel = 'Desativado'): string {
  return value ? enabledLabel : disabledLabel;
}

export function buildWizardReviewSections(auctionDetails?: Partial<Auction>): WizardReviewSections {
  const auctionDocuments = getPublicAuctionDocuments(auctionDetails);
  const lowerCaseIncludes = (value: string | undefined, needle: string) => value?.toLowerCase().includes(needle) ?? false;
  const documentByKeywords = (keywords: string[]): string | undefined => {
    return auctionDocuments.find((document) => keywords.some((keyword) => lowerCaseIncludes(document.title, keyword) || lowerCaseIncludes(document.fileName, keyword)))?.fileUrl;
  };

  const editalUrl = documentByKeywords(['edital', 'document']) ?? auctionDocuments[0]?.fileUrl;
  const laudoUrl = documentByKeywords(['laudo', 'avali']) ?? auctionDocuments[1]?.fileUrl;
  const certidaoUrl = documentByKeywords(['certid', 'matric']) ?? auctionDocuments[2]?.fileUrl;

  return {
    support: [
      { label: 'Telefone de suporte', value: formatText(auctionDetails?.supportPhone) },
      { label: 'Email de suporte', value: formatText(auctionDetails?.supportEmail) },
      { label: 'WhatsApp', value: formatText(auctionDetails?.supportWhatsApp) },
    ],
    documents: [
      { label: 'Documentos do leilão', value: formatText(editalUrl) },
      { label: 'Laudo de avaliação', value: formatText(laudoUrl) },
      { label: 'Certidão/Matrícula', value: formatText(certidaoUrl) },
      { label: 'Vara/Filial de venda', value: formatText(auctionDetails?.sellingBranch) },
    ],
    bidding: [
      { label: 'Lances parcelados', value: formatToggle(auctionDetails?.allowInstallmentBids, 'Permitido', 'Desativado') },
      { label: 'Múltiplos lances por usuário', value: formatToggle(auctionDetails?.allowMultipleBidsPerUser, 'Permitido', 'Desativado') },
      { label: 'Lances sigilosos', value: formatToggle(auctionDetails?.silentBiddingEnabled) },
      { label: 'Lance automático', value: formatToggle(auctionDetails?.automaticBiddingEnabled) },
      { label: 'Soft close', value: formatToggle(auctionDetails?.softCloseEnabled) },
      {
        label: 'Janela de soft close',
        value: auctionDetails?.softCloseEnabled
          ? `${auctionDetails?.softCloseMinutes ?? 2} minuto(s)`
          : NOT_APPLICABLE,
      },
    ],
  };
}