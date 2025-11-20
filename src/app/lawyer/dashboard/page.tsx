'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';
import { getLawyerDashboardOverviewAction } from './actions';
import { LawyerImpersonationSelector } from './lawyer-impersonation-selector';
import { ImpersonationBanner } from '@/components/admin/impersonation-banner';
import type {
  LawyerDashboardOverview,
  LawyerCaseStatus,
  LawyerDocumentStatus,
  LawyerTaskPriority,
  LawyerTaskStatus,
} from '@/types/lawyer-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Scale,
  CalendarClock,
  FileText,
  TrendingUp,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const emptyOverview: LawyerDashboardOverview = {
  metrics: {
    activeCases: 0,
    hearingsThisWeek: 0,
    documentsPending: 0,
    totalPortfolioValue: 0,
  },
  monetization: {
    model: 'SUBSCRIPTION',
    label: 'Assinatura Mensal',
    description: 'Monitore as condições comerciais do plano jurídico.',
    amountLabel: 'R$ 0,00',
    nextBillingDate: null,
  },
  cases: [],
  tasks: [],
  documents: [],
  upcomingHearings: [],
};

const caseStatusLabels: Record<LawyerCaseStatus, string> = {
  EM_ANDAMENTO: 'Em andamento',
  EM_PREPARACAO: 'Em preparação',
  CONCLUIDO: 'Concluído',
};

const caseStatusVariants: Record<LawyerCaseStatus, 'default' | 'secondary' | 'outline'> = {
  EM_ANDAMENTO: 'secondary',
  EM_PREPARACAO: 'outline',
  CONCLUIDO: 'default',
};

const documentStatusLabels: Record<LawyerDocumentStatus, string> = {
  NOT_SENT: 'Não enviado',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado',
  PENDING_ANALYSIS: 'Em análise',
};

const documentStatusVariants: Record<LawyerDocumentStatus, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  NOT_SENT: 'outline',
  SUBMITTED: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  PENDING_ANALYSIS: 'secondary',
};

const taskStatusLabels: Record<LawyerTaskStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
};

const taskPriorityLabels: Record<LawyerTaskPriority, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

const taskPriorityVariants: Record<LawyerTaskPriority, 'destructive' | 'default' | 'secondary'> = {
  ALTA: 'destructive',
  MEDIA: 'default',
  BAIXA: 'secondary',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function hydrateOverview(raw: LawyerDashboardOverview): LawyerDashboardOverview {
  return {
    ...raw,
    monetization: {
      ...raw.monetization,
      nextBillingDate: raw.monetization.nextBillingDate ? new Date(raw.monetization.nextBillingDate) : null,
    },
    cases: raw.cases.map((item) => ({
      ...item,
      nextEventDate: item.nextEventDate ? new Date(item.nextEventDate) : null,
      updatedAt: new Date(item.updatedAt),
    })),
    tasks: raw.tasks.map((task) => ({
      ...task,
      dueDate: new Date(task.dueDate),
    })),
    documents: raw.documents.map((doc) => ({
      ...doc,
      updatedAt: new Date(doc.updatedAt),
    })),
    upcomingHearings: raw.upcomingHearings.map((hearing) => ({
      ...hearing,
      date: new Date(hearing.date),
    })),
  };
}

export default function LawyerDashboardPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<LawyerDashboardOverview>(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impersonatedLawyerId, setImpersonatedLawyerId] = useState<string | null>(null);
  const [impersonatedLawyerName, setImpersonatedLawyerName] = useState<string | null>(null);

  const hasAccess = useMemo(
    () => hasAnyPermission(userProfileWithPermissions, ['lawyer_dashboard:view', 'manage_all']),
    [userProfileWithPermissions]
  );

  const isAdmin = useMemo(
    () => hasAnyPermission(userProfileWithPermissions, ['manage_all', 'admin']),
    [userProfileWithPermissions]
  );

  useEffect(() => {
    async function fetchData(userId: string, impersonateId?: string) {
      try {
        setIsLoading(true);
        const data = await getLawyerDashboardOverviewAction(userId, impersonateId);
        setOverview(hydrateOverview(data));
        setError(null);
      } catch (err) {
        console.error('Error fetching lawyer dashboard:', err);
        setError('Não foi possível carregar os dados do painel.');
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && hasAccess && userProfileWithPermissions?.id) {
      fetchData(userProfileWithPermissions.id.toString(), impersonatedLawyerId ?? undefined);
    }
  }, [authLoading, hasAccess, userProfileWithPermissions, impersonatedLawyerId]);

  const metrics = useMemo(
    () => [
      {
        label: 'Casos ativos',
        value: overview.metrics.activeCases.toString(),
        description: 'Processos vinculados com movimentação recente.',
        icon: Scale,
        testId: 'active-cases',
      },
      {
        label: 'Audiências na semana',
        value: overview.metrics.hearingsThisWeek.toString(),
        description: 'Eventos e prazos previstos nos próximos 7 dias.',
        icon: CalendarClock,
        testId: 'hearings-week',
      },
      {
        label: 'Documentos pendentes',
        value: overview.metrics.documentsPending.toString(),
        description: 'Arquivos aguardando análise ou conclusão.',
        icon: FileText,
        testId: 'documents-pending',
      },
      {
        label: 'Valor em carteira',
        value: formatCurrency(overview.metrics.totalPortfolioValue),
        description: 'Estimativa das oportunidades sob gestão.',
        icon: TrendingUp,
        testId: 'portfolio-value',
      },
    ],
    [overview.metrics]
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]" data-ai-id="lawyer-dashboard-loading-state">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Montando visão executiva do painel jurídico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10" data-ai-id="lawyer-dashboard-error-state">
        <CardHeader className="flex flex-row items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <CardTitle className="text-lg">Não foi possível carregar o painel</CardTitle>
            <CardDescription>{error}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div
      className="space-y-6"
      data-ai-id="lawyer-dashboard-page"
      data-testid="lawyer-dashboard-root"
    >
      {impersonatedLawyerId && impersonatedLawyerName && (
        <ImpersonationBanner
          impersonatedName={impersonatedLawyerName}
          onExit={() => {
            setImpersonatedLawyerId(null);
            setImpersonatedLawyerName(null);
          }}
          className="-mx-6 -mt-6 mb-6"
        />
      )}

      <div className="space-y-1">
        <h1
          className="text-3xl font-bold tracking-tight"
          data-testid="lawyer-dashboard-title"
        >
          Painel Jurídico
        </h1>
        <p className="text-sm text-muted-foreground" data-testid="lawyer-dashboard-subtitle">
          Visão consolidada dos processos, audiências e entregáveis sob responsabilidade da equipe jurídica.
        </p>
      </div>

      {isAdmin && userProfileWithPermissions?.id && (
        <LawyerImpersonationSelector
          currentUserId={userProfileWithPermissions.id.toString()}
          selectedLawyerId={impersonatedLawyerId}
          onLawyerChange={setImpersonatedLawyerId}
          onLawyerSelected={(lawyer) => setImpersonatedLawyerName(lawyer?.fullName || lawyer?.email || null)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => (
          <Card
            key={metric.label}
            className="shadow-sm"
            data-testid={`lawyer-metric-${metric.testId}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
              <metric.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card
          className="shadow-sm"
          data-ai-id="lawyer-dashboard-cases-card"
          data-testid="lawyer-cases-card"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Carteira jurídica</CardTitle>
                <CardDescription>Resumo dos processos sob responsabilidade do escritório.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {overview.cases.length} processo(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {overview.cases.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="lawyer-cases-empty">
                Nenhum processo vinculado ao seu usuário advogado até o momento.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table data-testid="lawyer-cases-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Processo</TableHead>
                      <TableHead>Atuação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Próximo evento</TableHead>
                      <TableHead className="text-right">Valor estimado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.cases.map((caseItem) => (
                      <TableRow key={caseItem.id} data-testid="lawyer-case-row">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{caseItem.processNumber}</span>
                            <span className="text-xs text-muted-foreground">
                              {caseItem.courtName ?? 'Sem vara definida'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {caseItem.role === 'ADVOGADO_AUTOR' ? 'Advogado do autor' : 'Advogado do réu'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={caseStatusVariants[caseItem.status]} className="text-xs">
                            {caseStatusLabels[caseItem.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {caseItem.nextEventDate ? (
                              <span className="text-sm font-medium">
                                {format(caseItem.nextEventDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem evento agendado</span>
                            )}
                            {caseItem.nextEventLabel && (
                              <span className="text-xs text-muted-foreground">{caseItem.nextEventLabel}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {formatCurrency(caseItem.estimatedValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="shadow-sm"
          data-ai-id="lawyer-dashboard-monetization-card"
          data-testid="lawyer-monetization-card"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Modelo comercial</CardTitle>
            <CardDescription>Condições vigentes para monetização do painel jurídico.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-primary">{overview.monetization.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{overview.monetization.description}</p>
              {overview.monetization.amountLabel && (
                <p className="text-sm mt-2 font-medium">{overview.monetization.amountLabel}</p>
              )}
              {overview.monetization.nextBillingDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Próxima cobrança prevista para {format(overview.monetization.nextBillingDate, "dd 'de' MMMM", { locale: ptBR })}.
                </p>
              )}
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Tarefas prioritárias
              </h3>
              {overview.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground" data-testid="lawyer-tasks-empty">
                  Nenhuma tarefa pendente no momento.
                </p>
              ) : (
                <ScrollArea className="h-56 pr-2" data-testid="lawyer-tasks-list">
                  <ul className="space-y-3">
                    {overview.tasks.map((task) => (
                      <li
                        key={task.id}
                        className="rounded-md border p-3"
                        data-testid="lawyer-task-item"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold leading-snug">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Prazo: {format(task.dueDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {(task.relatedProcessNumber || task.relatedProcessId) && (
                              <p className="text-xs text-muted-foreground">
                                Vinculado ao processo {task.relatedProcessNumber ?? `#${task.relatedProcessId}`}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge variant={taskPriorityVariants[task.priority]} className="text-[10px]">
                              {taskPriorityLabels[task.priority]}
                            </Badge>
                            <Badge variant={task.status === 'CONCLUIDA' ? 'default' : 'secondary'} className="text-[10px]">
                              {taskStatusLabels[task.status]}
                            </Badge>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className="shadow-sm"
          data-ai-id="lawyer-dashboard-hearings-card"
          data-testid="lawyer-hearings-card"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-semibold">Agenda e audiências</CardTitle>
                <CardDescription>Próximos eventos associados aos seus processos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {overview.upcomingHearings.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="lawyer-hearings-empty">
                Não há audiências agendadas para os próximos dias.
              </p>
            ) : (
              <ul className="space-y-4" data-testid="lawyer-hearings-list">
                {overview.upcomingHearings.map((hearing) => (
                  <li
                    key={hearing.id}
                    className="rounded-md border p-3"
                    data-testid="lawyer-hearing-item"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{hearing.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Processo {hearing.processNumber}</p>
                        {hearing.location && (
                          <p className="text-xs text-muted-foreground">{hearing.location}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {format(hearing.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Badge>
                        <Badge variant={hearing.status === 'CONCLUIDA' ? 'default' : 'secondary'} className="text-[10px]">
                          {hearing.status === 'CONCLUIDA' ? 'Concluída' : 'Agendada'}
                        </Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card
          className="shadow-sm"
          data-ai-id="lawyer-dashboard-documents-card"
          data-testid="lawyer-documents-card"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-semibold">Documentos operacionais</CardTitle>
                <CardDescription>Acompanhamento dos arquivos enviados pela equipe jurídica.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {overview.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="lawyer-documents-empty">
                Nenhum documento enviado recentemente.
              </p>
            ) : (
              <div className="space-y-3" data-testid="lawyer-documents-list">
                {overview.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                    data-testid="lawyer-document-item"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {document.fileName ?? document.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Atualizado em {format(document.updatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant={documentStatusVariants[document.status]} className="text-[10px]">
                      {documentStatusLabels[document.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
