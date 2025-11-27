// src/services/lawyer-dashboard.service.ts
/**
 * @fileoverview Serviço responsável por agregar e transformar dados jurídicos
 * em métricas consumíveis pelo painel do advogado.
 */

import { prisma } from '@/lib/prisma';
import { PlatformSettingsService } from '@/services/platform-settings.service';
import type {
  LawyerDashboardOverview,
  LawyerCaseRole,
  LawyerCaseStatus,
  LawyerCaseSummary,
  LawyerHearingSummary,
  LawyerMonetizationInfo,
  LawyerTaskPriority,
  LawyerTaskSummary,
  LawyerTaskStatus,
  LawyerDocumentSummary,
  LawyerDocumentStatus,
} from '@/types/lawyer-dashboard';

const platformSettingsService = new PlatformSettingsService();

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number.parseFloat(value);
  if (typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  return Number(value);
}

function humanizeMonetization(model: LawyerMonetizationInfo['model']): LawyerMonetizationInfo {
  const base: Record<LawyerMonetizationInfo['model'], LawyerMonetizationInfo> = {
    SUBSCRIPTION: {
      model: 'SUBSCRIPTION',
      label: 'Assinatura Mensal',
      description: 'Cobrança recorrente pela utilização do portal jurídico.',
      amountLabel: 'R$ 299,00 por mês',
    },
    PAY_PER_USE: {
      model: 'PAY_PER_USE',
      label: 'Pagar por Uso',
      description: 'Cobrança aplicada por consulta processual ou diligência confirmada.',
      amountLabel: 'R$ 150,00 por consulta',
    },
    REVENUE_SHARE: {
      model: 'REVENUE_SHARE',
      label: 'Revenue Share',
      description: 'Percentual calculado sobre o valor do arremate quando há atuação jurídica.',
      amountLabel: '15% do valor líquido recebido',
    },
  };

  const nextBillingDate = new Date();
  if (model === 'SUBSCRIPTION') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else {
    nextBillingDate.setDate(nextBillingDate.getDate() + 7);
  }

  return {
    ...base[model],
    nextBillingDate,
  };
}

function deriveCaseStatus(
  nextEventDate: Date | null,
  auctionStatuses: string[],
  lotsCount: number
): LawyerCaseStatus {
  const hasClosedAuction = auctionStatuses.some(status => ['ENCERRADO', 'FINALIZADO', 'CANCELADO'].includes(status));
  if (hasClosedAuction && !nextEventDate) {
    return 'CONCLUIDO';
  }

  if (nextEventDate) {
    return 'EM_ANDAMENTO';
  }

  return lotsCount > 0 ? 'EM_ANDAMENTO' : 'EM_PREPARACAO';
}

function buildTasksFromCases(cases: LawyerCaseSummary[]): LawyerTaskSummary[] {
  const now = new Date();
  return cases.slice(0, 4).map((caseSummary, index) => {
    const status: LawyerTaskStatus = index === 0 ? 'EM_ANDAMENTO' : 'PENDENTE';
    const priority: LawyerTaskPriority = index === 0 ? 'ALTA' : index === 1 ? 'MEDIA' : 'BAIXA';
    const dueDate = new Date(now.getTime());
    dueDate.setDate(dueDate.getDate() + (index + 1));

    return {
      id: `task-${caseSummary.id}-${index}`,
      title: `Revisar documentação do processo ${caseSummary.processNumber}`,
      dueDate,
      status,
      priority,
      relatedProcessId: caseSummary.id,
      relatedProcessNumber: caseSummary.processNumber,
    };
  });
}

export class LawyerDashboardService {
  async getOverview(userId: string): Promise<LawyerDashboardOverview> {
    const userPrimaryKey = this.parseUserId(userId);

    const user = await prisma.user.findUnique({
      where: { id: userPrimaryKey },
      include: {
        documents: true,
        tenants: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuário advogado não encontrado.');
    }

    const userDocuments = user.documents ?? [];
    const tenantId = user.tenants?.[0]?.tenantId ? String(user.tenants[0].tenantId) : '1';
    const lawyerCpf = user.cpf ?? null;

    const emptyOverview: LawyerDashboardOverview = {
      metrics: {
        activeCases: 0,
        hearingsThisWeek: 0,
        documentsPending: userDocuments.filter((doc) => doc.status !== 'APPROVED').length,
        totalPortfolioValue: 0,
      },
      monetization: humanizeMonetization('SUBSCRIPTION'),
      cases: [],
      tasks: [],
      documents: userDocuments.map<LawyerDocumentSummary>((doc) => ({
        id: doc.id?.toString() ?? '',
        type: doc.documentTypeId?.toString() ?? 'Documento',
        status: doc.status as LawyerDocumentStatus,
        updatedAt: doc.updatedAt,
        fileName: doc.fileName ?? undefined,
      })),
      upcomingHearings: [],
    };

    if (!lawyerCpf) {
      return emptyOverview;
    }

    const processes = await prisma.judicialProcess.findMany({
      where: {
        tenantId: BigInt(tenantId),
        parties: {
          some: {
            documentNumber: lawyerCpf,
            partyType: { in: ['ADVOGADO_AUTOR', 'ADVOGADO_REU'] },
          },
        },
      },
      include: {
        court: true,
        branch: true,
        seller: true,
        parties: true,
        assets: true,
        lots: {
          include: {
            auction: true,
          },
        },
      },
    });

    const now = new Date();
    const sevenDaysAhead = new Date(now.getTime());
    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

    const cases: LawyerCaseSummary[] = processes.map((process): LawyerCaseSummary => {
      const relevantParty = process.parties.find((party: any) => party.documentNumber === lawyerCpf);
      const role = (relevantParty?.partyType || 'ADVOGADO_AUTOR') as LawyerCaseRole;

      const auctions = process.lots
        .map((lot: any) => lot.auction)
        .filter((auction: any): auction is NonNullable<typeof auction> => Boolean(auction));

      const nextEventDate = auctions
        .map((auction: any) => auction.auctionDate ? new Date(auction.auctionDate) : null)
        .filter((date: any): date is Date => Boolean(date) && !Number.isNaN(date.getTime()))
        .sort((a: any, b: any) => a.getTime() - b.getTime())[0] ?? null;

      const auctionStatuses = auctions.map((auction: any) => auction.status).filter(Boolean) as string[];
      const lotsCount = process.lots.length;
      const assetsCount = process.assets.length;

      const lotsValue = process.lots.reduce((total: any, lot: any) => total + toNumber(lot.price ?? lot.initialPrice ?? 0), 0);
      const assetsValue = process.assets.reduce((total: any, asset: any) => total + toNumber(asset.evaluationValue ?? 0), 0);
      const estimatedValue = Math.max(lotsValue, assetsValue);

      const status = deriveCaseStatus(nextEventDate, auctionStatuses, lotsCount);

      const nextEventLabel = nextEventDate
        ? new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(Math.round(
            (nextEventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ), 'day')
        : null;

      const caseSummary: LawyerCaseSummary = {
        id: process.id.toString(),
        processNumber: process.processNumber,
        courtName: process.court?.name ?? null,
        branchName: process.branch?.name ?? null,
        sellerName: process.seller?.name ?? null,
        role,
        status,
        lotsCount,
        assetsCount,
        estimatedValue,
        nextEventDate,
        nextEventLabel,
        updatedAt: process.updatedAt,
      };
      return caseSummary;
    });

    const casesWithEvent = cases.filter(
      (caseSummary): caseSummary is LawyerCaseSummary & { nextEventDate: Date } =>
        Boolean(caseSummary.nextEventDate)
    );

    const upcomingHearings: LawyerHearingSummary[] = casesWithEvent
      .map<LawyerHearingSummary>((caseSummary) => ({
        id: `hearing-${caseSummary.id}`,
        processId: caseSummary.id,
        processNumber: caseSummary.processNumber,
        title: `Próxima praça - ${caseSummary.processNumber}`,
        date: caseSummary.nextEventDate,
        location: caseSummary.courtName,
        status: caseSummary.nextEventDate < now ? 'CONCLUIDA' : 'AGENDADA',
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const hearingsThisWeek = upcomingHearings.filter(hearing => hearing.date <= sevenDaysAhead).length;
    const totalPortfolioValue = cases.reduce((total, caseSummary) => total + caseSummary.estimatedValue, 0);

    const documents: LawyerDocumentSummary[] = userDocuments.map((doc) => ({
      id: doc.id?.toString() ?? '',
      type: doc.documentTypeId?.toString() ?? 'Documento',
      status: doc.status as LawyerDocumentStatus,
      updatedAt: doc.updatedAt,
      fileName: doc.fileName ?? undefined,
    }));
    const documentsPending = documents.filter(doc => doc.status !== 'APPROVED').length;

    const tasks = cases.length > 0 ? buildTasksFromCases(cases) : [];

    let monetization = humanizeMonetization('SUBSCRIPTION');
    try {
      const platformSettings = await platformSettingsService.getSettings(tenantId);
      const monetizationModel = (platformSettings as Partial<{ lawyerMonetizationModel?: string }>).
        lawyerMonetizationModel;
      const supportedModels: LawyerMonetizationInfo['model'][] = ['SUBSCRIPTION', 'PAY_PER_USE', 'REVENUE_SHARE'];
      if (monetizationModel && supportedModels.includes(monetizationModel as LawyerMonetizationInfo['model'])) {
        monetization = humanizeMonetization(monetizationModel as LawyerMonetizationInfo['model']);
      }
    } catch (error) {
      console.warn('[LawyerDashboardService] Falha ao carregar configurações da plataforma para monetização do advogado.', error);
    }

    return {
      metrics: {
        activeCases: cases.length,
        hearingsThisWeek,
        documentsPending,
        totalPortfolioValue,
      },
      monetization,
      cases,
      tasks,
      documents,
      upcomingHearings,
    };
  }

  private parseUserId(rawId: string): bigint | number {
    if (typeof rawId === 'number' || typeof rawId === 'bigint') {
      return rawId;
    }

    const numericId = rawId.trim();

    if (!numericId) {
      throw new Error('Identificador de usuário não pode ser vazio.');
    }

    if (/^\d+$/.test(numericId)) {
      try {
        return BigInt(numericId);
      } catch {
        const asNumber = Number(numericId);
        if (!Number.isNaN(asNumber)) {
          return asNumber;
        }
      }
    }

    throw new Error(`Identificador de usuário inválido: ${rawId}`);
  }
}

export const lawyerDashboardService = new LawyerDashboardService();
