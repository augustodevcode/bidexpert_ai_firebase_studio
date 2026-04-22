/**
 * @fileoverview Regras derivadas para o painel de due diligence do lote.
 */

import type { Auction, Lot, LotRisk, LotRiskLevel, OccupationStatus } from '@/types';
import { getAuctionDocumentLabel, getPublicAuctionDocuments } from '@/lib/auctions/documents';

export type DueDiligenceChecklistStatus = 'available' | 'attention' | 'missing';
export type DueDiligenceAlertTone = 'success' | 'info' | 'warning' | 'critical';

export interface DueDiligenceChecklistItem {
  key: string;
  label: string;
  status: DueDiligenceChecklistStatus;
  detail: string;
}

export interface DueDiligenceLink {
  key: string;
  label: string;
  href: string;
}

export interface DueDiligenceAlert {
  tone: DueDiligenceAlertTone;
  title: string;
  description: string;
}

export interface LotDueDiligenceSummary {
  alert: DueDiligenceAlert;
  checklist: DueDiligenceChecklistItem[];
  links: DueDiligenceLink[];
  sortedRisks: LotRisk[];
}

export type DueDiligenceLotLike = Partial<Pick<Lot,
  | 'propertyMatricula'
  | 'propertyRegistrationNumber'
  | 'occupancyStatus'
  | 'actionType'
  | 'actionDescription'
  | 'actionCnjCode'
  | 'lotRisks'
  | 'judicialProcessNumber'
  | 'courtDistrict'
  | 'courtName'
  | 'publicProcessUrl'
  | 'propertyLiens'
  | 'knownDebts'
  | 'additionalDocumentsInfo'
>>;

export type DueDiligenceAuctionLike = Partial<Pick<Auction,
  | 'documents'
  | 'documentsUrl'
  | 'evaluationReportUrl'
  | 'auctionCertificateUrl'
  | 'auctionType'
>>;

const riskPriority: LotRiskLevel[] = ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO'];

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

export function sortLotRisksBySeverity(risks?: LotRisk[] | null): LotRisk[] {
  if (!risks || risks.length === 0) {
    return [];
  }

  return [...risks].sort((left, right) => {
    return riskPriority.indexOf(left.riskLevel as LotRiskLevel) - riskPriority.indexOf(right.riskLevel as LotRiskLevel);
  });
}

export function buildLotDueDiligenceSummary(args: {
  lot: DueDiligenceLotLike;
  auction?: DueDiligenceAuctionLike | null;
}): LotDueDiligenceSummary {
  const { lot, auction } = args;
  const auctionDocuments = getPublicAuctionDocuments(auction);
  const sortedRisks = sortLotRisksBySeverity(lot.lotRisks);
  const highestRisk = sortedRisks[0];
  const occupancyStatus = lot.occupancyStatus as OccupationStatus | undefined;

  const checklist: DueDiligenceChecklistItem[] = [
    {
      key: 'registry',
      label: 'Matrícula e registro',
      status: hasText(lot.propertyMatricula) || hasText(lot.propertyRegistrationNumber) ? 'available' : 'missing',
      detail: hasText(lot.propertyMatricula) || hasText(lot.propertyRegistrationNumber)
        ? 'Identificação registral disponível para conferência.'
        : 'Nenhum identificador registral foi informado.',
    },
    {
      key: 'process',
      label: 'Processo e consulta pública',
      status: hasText(lot.judicialProcessNumber) || hasText(lot.publicProcessUrl) ? 'available' : (auction?.auctionType === 'JUDICIAL' ? 'attention' : 'missing'),
      detail: hasText(lot.judicialProcessNumber) || hasText(lot.publicProcessUrl)
        ? 'Processo judicial ou link oficial de consulta disponível.'
        : (auction?.auctionType === 'JUDICIAL' ? 'Leilão judicial sem dados completos de processo na página.' : 'Sem processo judicial aplicável.'),
    },
    {
      key: 'occupancy',
      label: 'Status de ocupação',
      status: occupancyStatus === 'OCCUPIED' ? 'attention' : (occupancyStatus ? 'available' : 'missing'),
      detail: occupancyStatus === 'OCCUPIED'
        ? 'Imóvel ocupado: considerar prazo e custo potencial de desocupação.'
        : (occupancyStatus ? 'Status de ocupação informado na vitrine.' : 'Não há status de ocupação explícito.'),
    },
    {
      key: 'liens',
      label: 'Ônus e gravames',
      status: hasText(lot.propertyLiens) ? 'attention' : 'missing',
      detail: hasText(lot.propertyLiens)
        ? 'Há observações de ônus/gravames para revisão.'
        : 'Nenhum ônus/gravame foi resumido na página.',
    },
    {
      key: 'debts',
      label: 'Dívidas conhecidas',
      status: hasText(lot.knownDebts) ? 'attention' : 'missing',
      detail: hasText(lot.knownDebts)
        ? 'Existem observações de dívidas ou despesas acessórias.'
        : 'Não há resumo público de dívidas conhecidas.',
    },
    {
      key: 'edital',
      label: 'Edital e documentos oficiais',
      status: auctionDocuments.length > 0 || hasText(lot.additionalDocumentsInfo) ? 'available' : 'missing',
      detail: auctionDocuments.length > 0 || hasText(lot.additionalDocumentsInfo)
        ? 'Há documento oficial ou observação documental para aprofundamento.'
        : 'A página não expõe edital ou observação documental consolidada.',
    },
    {
      key: 'risk',
      label: 'Riscos identificados',
      status: highestRisk ? (highestRisk.riskLevel === 'CRITICO' || highestRisk.riskLevel === 'ALTO' ? 'attention' : 'available') : 'missing',
      detail: highestRisk
        ? `Maior severidade encontrada: ${highestRisk.riskLevel}.`
        : 'Nenhum risco estruturado foi informado para o lote.',
    },
  ];

  const links: DueDiligenceLink[] = [];
  if (hasText(lot.publicProcessUrl)) {
    links.push({ key: 'public-process', label: 'Consultar processo público', href: lot.publicProcessUrl!.trim() });
  }
  auctionDocuments.forEach((document, index) => {
    links.push({
      key: index === 0 ? 'auction-notice' : `auction-document-${index + 1}`,
      label: index === 0 ? 'Abrir edital do leilão' : `Abrir documento: ${getAuctionDocumentLabel(document, index)}`,
      href: document.fileUrl.trim(),
    });
  });

  let alert: DueDiligenceAlert;
  if (highestRisk?.riskLevel === 'CRITICO') {
    alert = {
      tone: 'critical',
      title: 'Risco jurídico crítico identificado',
      description: 'Revise os riscos estruturados e o edital antes de qualquer tomada de decisão.',
    };
  } else if (occupancyStatus === 'OCCUPIED' || hasText(lot.propertyLiens) || hasText(lot.knownDebts)) {
    alert = {
      tone: 'warning',
      title: 'Due diligence reforçada recomendada',
      description: 'Há sinais de ocupação, ônus ou dívidas que podem alterar o custo real da arrematação.',
    };
  } else if (auction?.auctionType === 'JUDICIAL' || hasText(lot.judicialProcessNumber)) {
    alert = {
      tone: 'info',
      title: 'Lote com contexto judicial/documental',
      description: 'Use o checklist abaixo para validar processo, edital, matrícula e riscos antes do lance.',
    };
  } else {
    alert = {
      tone: 'success',
      title: 'Checklist documental disponível',
      description: 'Os principais sinais públicos de decisão estão organizados para sua revisão inicial.',
    };
  }

  return {
    alert,
    checklist,
    links,
    sortedRisks,
  };
}