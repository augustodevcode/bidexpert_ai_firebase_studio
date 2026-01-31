/**
 * @fileoverview Componentes de visualização do painel de auditoria.
 * Separa a renderização da UI da lógica de carregamento e ações.
 */

import type { ElementType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerCrash, AlertTriangle, CheckCircle, Package, Gavel, Ban, ListTodo, Edit, RefreshCw, ImageOff, Link as LinkIcon, Users, CalendarX2, UserX, Scale, ClipboardX, MapPinned, ImageMinus } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { AuditData } from './audit-utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: ElementType;
}

interface AuditDashboardViewProps {
  auditData: AuditData | null;
  isLoading: boolean;
  onRefresh: () => void;
}

type InconsistentItem = Record<string, unknown> & {
  title?: string | null;
  fullName?: string | null;
  email?: string | null;
  name?: string | null;
};

type InconsistentAuctionItem = {
  auction: {
    id?: string | number | bigint | null;
    title?: string | null;
    publicId?: string | null;
    status?: string | null;
  };
  lots: {
    id?: string | number | bigint | null;
    title?: string | null;
    status?: string | null;
    publicId?: string | null;
  }[];
};

const slugifyAiId = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => {
  const cardId = `audit-stat-${slugifyAiId(title)}`;
  return (
    <Card data-ai-id={cardId} className={value > 0 ? 'border-destructive bg-destructive/10' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}>
      <CardHeader data-ai-id={`${cardId}-header`} className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle data-ai-id={`${cardId}-title`} className="text-sm font-medium">{title}</CardTitle>
        <Icon data-ai-id={`${cardId}-icon`} className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent data-ai-id={`${cardId}-content`}>
        <div data-ai-id={`${cardId}-value`} className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

const resolveItemLabel = (item: InconsistentItem, fallback: string) => {
  const candidates = [item.title, item.fullName, item.email, item.name];
  const label = candidates.find(value => typeof value === 'string' && value.trim().length > 0);
  return label ?? fallback;
};

const InconsistentAccordion = ({ title, data, entityPath, message, idField = 'id', publicIdField = 'publicId' }: { title: string, data: InconsistentItem[], entityPath: string, message: string, idField?: string, publicIdField?: string }) => {
  if (!data || data.length === 0) return null;
  const accordionId = `audit-accordion-${slugifyAiId(title)}`;
  return (
    <Card data-ai-id={accordionId}>
      <CardHeader data-ai-id={`${accordionId}-header`}>
        <CardTitle data-ai-id={`${accordionId}-title`} className="text-base flex items-center gap-2">
          <AlertTriangle data-ai-id={`${accordionId}-icon`} className="h-5 w-5 text-destructive"/>
          {title} ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent data-ai-id={`${accordionId}-content`}>
        <Accordion data-ai-id={`${accordionId}-list`} type="single" collapsible className="w-full">
          {data.map((item, index) => {
            const rawId = item[idField] ?? item[publicIdField] ?? index;
            const itemId = String(rawId);
            const label = resolveItemLabel(item, `ID: ${itemId}`);
            const publicId = item[publicIdField] ?? item[idField] ?? itemId;
            return (
              <AccordionItem data-ai-id={`${accordionId}-item-${itemId}`} value={itemId} key={itemId}>
                <AccordionTrigger data-ai-id={`${accordionId}-trigger-${itemId}`}>
                  <div data-ai-id={`${accordionId}-row-${itemId}`} className="flex justify-between items-center w-full pr-4">
                    <span data-ai-id={`${accordionId}-label-${itemId}`} className="truncate" title={label}>{label}</span>
                    <Button data-ai-id={`${accordionId}-fix-${itemId}`} asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                      <Link data-ai-id={`${accordionId}-fix-link-${itemId}`} href={`/admin/${entityPath}/${publicId}/edit`}>
                        <Edit data-ai-id={`${accordionId}-fix-icon-${itemId}`} className="mr-2 h-3.5 w-3.5"/> Corrigir
                    </Link>
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent data-ai-id={`${accordionId}-content-${itemId}`}>
                  <p data-ai-id={`${accordionId}-message-${itemId}`} className="text-sm text-muted-foreground p-2 bg-muted rounded-md">{message}</p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

const InconsistentAuctionAccordion = ({ title, data }: { title: string, data: InconsistentAuctionItem[] }) => {
  if (!data || data.length === 0) return null;
  const accordionId = `audit-accordion-${slugifyAiId(title)}`;
  return (
    <Card data-ai-id={accordionId}>
      <CardHeader data-ai-id={`${accordionId}-header`}>
        <CardTitle data-ai-id={`${accordionId}-title`} className="text-base flex items-center gap-2">
          <AlertTriangle data-ai-id={`${accordionId}-icon`} className="h-5 w-5 text-destructive"/>
          {title} ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent data-ai-id={`${accordionId}-content`}>
        <Accordion data-ai-id={`${accordionId}-list`} type="single" collapsible className="w-full">
          {data.map(({ auction, lots }, index) => {
            const auctionId = String(auction.id ?? index);
            const auctionTitle = auction.title ?? `Leilão ${auctionId}`;
            const auctionStatus = auction.status ?? 'INDEFINIDO';
            const auctionPublicId = auction.publicId ?? auctionId;
            return (
              <AccordionItem data-ai-id={`${accordionId}-item-${auctionId}`} value={auctionId} key={auctionId}>
                <AccordionTrigger data-ai-id={`${accordionId}-trigger-${auctionId}`}>
                  <div data-ai-id={`${accordionId}-row-${auctionId}`} className="flex justify-between items-center w-full pr-4">
                    <span data-ai-id={`${accordionId}-label-${auctionId}`} className="truncate" title={auctionTitle}>{auctionTitle}</span>
                    <div data-ai-id={`${accordionId}-actions-${auctionId}`} className="flex items-center gap-2">
                      <Badge data-ai-id={`${accordionId}-status-${auctionId}`} variant="destructive">{auctionStatus}</Badge>
                      <Button data-ai-id={`${accordionId}-fix-${auctionId}`} asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Link data-ai-id={`${accordionId}-fix-link-${auctionId}`} href={`/admin/auctions/${auctionPublicId}/edit`}>
                          <Edit data-ai-id={`${accordionId}-fix-icon-${auctionId}`} className="mr-2 h-3.5 w-3.5"/> Corrigir Leilão
                      </Link>
                    </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent data-ai-id={`${accordionId}-content-${auctionId}`}>
                  <div data-ai-id={`${accordionId}-details-${auctionId}`} className="p-2 bg-muted rounded-md space-y-2">
                    <p data-ai-id={`${accordionId}-lots-title-${auctionId}`} className="text-sm font-semibold">Lotes com status inconsistente:</p>
                    <ul data-ai-id={`${accordionId}-lots-${auctionId}`} className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {lots.map((lot, lotIndex) => {
                        const lotId = String(lot.id ?? `${auctionId}-${lotIndex}`);
                        const lotTitle = lot.title ?? `Lote ${lotId}`;
                        const lotStatus = lot.status ?? 'INDEFINIDO';
                        const lotPublicId = lot.publicId ?? lotId;
                        return (
                          <li data-ai-id={`${accordionId}-lot-${lotId}`} key={lotId}>
                            <Link data-ai-id={`${accordionId}-lot-link-${lotId}`} href={`/admin/lots/${lotPublicId}/edit`} className="hover:underline hover:text-primary">
                              {lotTitle}
                            </Link>
                            <Badge data-ai-id={`${accordionId}-lot-status-${lotId}`} variant="secondary" className="ml-2">{lotStatus}</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export function AuditDashboardView({ auditData, isLoading, onRefresh }: AuditDashboardViewProps) {
  if (isLoading && !auditData) {
    return <div data-ai-id="audit-loading" className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando auditoria...</div>;
  }

  const totalInconsistencies =
    (auditData?.auctionsWithoutLots.length || 0) +
    (auditData?.lotsWithoutAssets.length || 0) +
    (auditData?.auctionsWithoutStages.length || 0) +
    (auditData?.closedAuctionsWithOpenLots.length || 0) +
    (auditData?.canceledAuctionsWithOpenLots.length || 0) +
    (auditData?.auctionsWithoutLocation.length || 0) +
    (auditData?.lotsWithoutLocation.length || 0) +
    (auditData?.assetsWithoutLocation.length || 0) +
    (auditData?.assetsWithoutRequiredLinks.length || 0) +
    (auditData?.endedLotsWithoutBids.length || 0) +
    (auditData?.directSalesWithMissingData.length || 0) +
    (auditData?.directSalesWithoutImages.length || 0) +
    (auditData?.directSalesWithoutLocation.length || 0) +
    (auditData?.lotsWithoutQuestions.length || 0) +
    (auditData?.lotsWithoutReviews.length || 0) +
    (auditData?.habilitatedUsersWithoutDocs.length || 0) +
    (auditData?.lotsWithoutImages.length || 0) +
    (auditData?.assetsWithoutImages.length || 0) +
    (auditData?.judicialAuctionsWithoutProcess.length || 0) +
    (auditData?.judicialAuctionsWithProcessMismatch.length || 0) +
    (auditData?.judicialSellersWithoutBranch.length || 0) +
    (auditData?.auctionsMissingResponsibleParties.length || 0) +
    (auditData?.auctionsMissingSchedule.length || 0) +
    (auditData?.lotsSoldWithoutWinner.length || 0) +
    (auditData?.assetsLoteadoWithoutLots.length || 0) +
    (auditData?.assetsDisponivelWithLots.length || 0);

  return (
    <div data-ai-id="audit-page" className="space-y-6">
      <Card data-ai-id="audit-header-card">
        <CardHeader data-ai-id="audit-header" className="flex flex-row items-center justify-between">
          <div data-ai-id="audit-header-content">
            <CardTitle data-ai-id="audit-header-title" className="text-2xl font-bold font-headline flex items-center">
              <ServerCrash data-ai-id="audit-header-icon" className="h-6 w-6 mr-2 text-primary" />
              Painel de Auditoria de Dados
            </CardTitle>
            <CardDescription data-ai-id="audit-header-description">
              Monitore a integridade e identifique inconsistências nos cadastros da plataforma.
            </CardDescription>
          </div>
          <Button data-ai-id="audit-refresh-button" variant="outline" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 data-ai-id="audit-refresh-loading" className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw data-ai-id="audit-refresh-icon" className="mr-2 h-4 w-4" />}
            {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
          </Button>
        </CardHeader>
      </Card>

      <Alert data-ai-id="audit-summary" variant={totalInconsistencies > 0 ? 'destructive' : 'default'} className={totalInconsistencies === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-500/50' : ''}>
        {totalInconsistencies > 0 ? <AlertTriangle data-ai-id="audit-summary-icon" className="h-4 w-4" /> : <CheckCircle data-ai-id="audit-summary-icon" className="h-4 w-4 text-green-600" />}
        <AlertTitle data-ai-id="audit-summary-title" className={totalInconsistencies > 0 ? 'text-destructive' : 'text-green-700 dark:text-green-300'}>
          {totalInconsistencies > 0 ? `${totalInconsistencies} Inconsistência(s) Encontrada(s)` : 'Tudo Certo!'}
        </AlertTitle>
        <AlertDescription data-ai-id="audit-summary-description">
          {totalInconsistencies > 0 ? 'Foram encontrados problemas na integridade dos dados que requerem sua atenção. Corrija os itens listados abaixo.' : 'Nenhuma inconsistência de dados foi encontrada na plataforma.'}
        </AlertDescription>
      </Alert>

      <div data-ai-id="audit-stat-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Leilões sem Lotes" value={auditData?.auctionsWithoutLots.length || 0} icon={Gavel} />
        <StatCard title="Lotes sem Ativos" value={auditData?.lotsWithoutAssets.length || 0} icon={Package} />
        <StatCard title="Leilões sem Etapas" value={auditData?.auctionsWithoutStages.length || 0} icon={ListTodo} />
        <StatCard title="Status Inconsistente" value={(auditData?.closedAuctionsWithOpenLots.length || 0) + (auditData?.canceledAuctionsWithOpenLots.length || 0)} icon={Ban} />
        <StatCard title="Itens sem Imagem" value={(auditData?.assetsWithoutImages.length || 0) + (auditData?.lotsWithoutImages.length || 0)} icon={ImageOff} />
        <StatCard title="Leilões Judiciais s/ Processo" value={auditData?.judicialAuctionsWithoutProcess.length || 0} icon={LinkIcon} />
        <StatCard title="Comitentes Judiciais s/ Vara" value={auditData?.judicialSellersWithoutBranch.length || 0} icon={LinkIcon} />
        <StatCard title="Lotes Encerrados sem Lances" value={auditData?.endedLotsWithoutBids.length || 0} icon={Gavel} />
        <StatCard title="Usuários Habilitados sem Docs" value={auditData?.habilitatedUsersWithoutDocs.length || 0} icon={Users} />
        <StatCard title="Leilões sem Responsáveis" value={auditData?.auctionsMissingResponsibleParties.length || 0} icon={UserX} />
        <StatCard title="Leilões sem Agenda" value={auditData?.auctionsMissingSchedule.length || 0} icon={CalendarX2} />
        <StatCard title="Lotes Vendidos sem Arrematante" value={auditData?.lotsSoldWithoutWinner.length || 0} icon={ClipboardX} />
        <StatCard title="Ativos Loteados sem Lote" value={auditData?.assetsLoteadoWithoutLots.length || 0} icon={Scale} />
        <StatCard title="Ativos Disponíveis em Lotes" value={auditData?.assetsDisponivelWithLots.length || 0} icon={Scale} />
        <StatCard title="Vendas Diretas sem Imagem" value={auditData?.directSalesWithoutImages.length || 0} icon={ImageMinus} />
        <StatCard title="Vendas Diretas sem Localização" value={auditData?.directSalesWithoutLocation.length || 0} icon={MapPinned} />
        <StatCard title="Judiciais com Tipo Divergente" value={auditData?.judicialAuctionsWithProcessMismatch.length || 0} icon={LinkIcon} />
      </div>

      <div data-ai-id="audit-accordion-list" className="space-y-4">
        <InconsistentAccordion title="Leilões Sem Lotes Cadastrados" data={auditData?.auctionsWithoutLots || []} entityPath="auctions" message="Este leilão não possui nenhum lote cadastrado. Adicione lotes para que ele possa ser publicado."/>
        <InconsistentAccordion title="Leilões Sem Praças/Etapas Definidas" data={auditData?.auctionsWithoutStages || []} entityPath="auctions" message="Este leilão precisa de pelo menos uma etapa (praça) com datas de início e fim."/>
        <InconsistentAccordion title="Leilões Judiciais sem Vínculo com Processo" data={auditData?.judicialAuctionsWithoutProcess || []} entityPath="auctions" message="Este leilão é do tipo JUDICIAL, mas nenhum processo foi vinculado a ele."/>
        <InconsistentAccordion title="Leilões Judiciais com Tipo Divergente" data={auditData?.judicialAuctionsWithProcessMismatch || []} entityPath="auctions" message="Este leilão possui processo judicial vinculado, mas o tipo não está marcado como JUDICIAL."/>
        <InconsistentAccordion title="Leilões sem Responsáveis Vinculados" data={auditData?.auctionsMissingResponsibleParties || []} entityPath="auctions" message="Este leilão publicado não possui comitente ou leiloeiro vinculados."/>
        <InconsistentAccordion title="Leilões sem Agenda Definida" data={auditData?.auctionsMissingSchedule || []} entityPath="auctions" message="Este leilão aberto não possui datas definidas na agenda ou etapas."/>
        <InconsistentAccordion title="Lotes Sem Ativos Vinculados" data={auditData?.lotsWithoutAssets || []} entityPath="lots" message="Este lote não tem nenhum ativo (bem) vinculado a ele." />
        <InconsistentAccordion title="Lotes Sem Imagem Principal" data={auditData?.lotsWithoutImages || []} entityPath="lots" message="Este lote não possui uma imagem principal definida, o que prejudica sua exibição." />
        <InconsistentAccordion title="Ativos (Bens) Sem Imagem Principal" data={auditData?.assetsWithoutImages || []} entityPath="assets" message="Este ativo não possui uma imagem principal, o que pode impedir que lotes o utilizem como imagem herdada." />
        <InconsistentAccordion title="Comitentes Judiciais sem Vínculo com uma Vara" data={auditData?.judicialSellersWithoutBranch || []} entityPath="sellers" message="Este comitente está marcado como JUDICIAL, mas não está associado a nenhuma vara específica." />
        <InconsistentAuctionAccordion title="Leilões Encerrados/Finalizados com Lotes Abertos" data={auditData?.closedAuctionsWithOpenLots || []} />
        <InconsistentAuctionAccordion title="Leilões Cancelados com Lotes Abertos" data={auditData?.canceledAuctionsWithOpenLots || []} />
        <InconsistentAccordion title="Ativos com Vínculos Obrigatórios Faltando" data={auditData?.assetsWithoutRequiredLinks || []} entityPath="assets" message="Este ativo não possui uma categoria ou um comitente vinculado, dados essenciais para o seu gerenciamento."/>
        <InconsistentAccordion title="Lotes Encerrados sem Nenhum Lance" data={auditData?.endedLotsWithoutBids || []} entityPath="lots" message="Este lote foi encerrado mas não recebeu nenhum lance. Considere relistá-lo ou analisar sua precificação."/>
        <InconsistentAccordion title="Lotes Vendidos sem Arrematante" data={auditData?.lotsSoldWithoutWinner || []} entityPath="lots" message="Este lote está vendido, mas não possui arrematante vinculado."/>
        <InconsistentAccordion title="Ativos Loteados sem Lote" data={auditData?.assetsLoteadoWithoutLots || []} entityPath="assets" message="Este ativo está marcado como LOTEADO, mas não possui vínculo com nenhum lote."/>
        <InconsistentAccordion title="Ativos Disponíveis vinculados a Lotes" data={auditData?.assetsDisponivelWithLots || []} entityPath="assets" message="Este ativo está DISPONÍVEL, mas já está vinculado a um lote. Avalie o status."/>
        <InconsistentAccordion title="Vendas Diretas com Dados Incompletos" data={auditData?.directSalesWithMissingData || []} entityPath="direct-sales" message="Esta venda direta está sem preço mínimo/valor ou vínculos essenciais."/>
        <InconsistentAccordion title="Vendas Diretas sem Imagem" data={auditData?.directSalesWithoutImages || []} entityPath="direct-sales" message="Esta venda direta não possui imagem principal definida."/>
        <InconsistentAccordion title="Vendas Diretas sem Localização" data={auditData?.directSalesWithoutLocation || []} entityPath="direct-sales" message="Esta venda direta não possui localização informada."/>
        <InconsistentAccordion title="Usuários Habilitados sem Documentos" data={auditData?.habilitatedUsersWithoutDocs || []} entityPath="users" message="Este usuário possui status de 'Habilitado', mas não tem nenhum documento cadastrado no sistema. Verifique a integridade do processo de habilitação." idField="id" publicIdField="id" />
      </div>
    </div>
  );
}
