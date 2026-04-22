
'use client';

import { useWizard } from '../wizard-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Gavel, FileText, Package, ListChecks, CalendarDays, User, Users, Rocket, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createAuctionFromWizard } from '@/app/admin/wizard/actions';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { buildWizardReviewSections, type WizardReviewItem } from '../wizard-review-sections';

function ReviewItemList({ items, testId }: { items: WizardReviewItem[]; testId: string }) {
  return (
    <dl className="space-y-3 text-sm" data-ai-id={testId}>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-1 gap-1 md:grid-cols-[220px_minmax(0,1fr)] md:gap-3">
          <dt className="font-medium text-foreground">{item.label}</dt>
          <dd className="break-all text-muted-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Step5Review() {
  const { wizardData } = useWizard();
  const [publishMode, setPublishMode] = useState<'edit' | 'control-center' | null>(null);
  const { toast } = useToast();


  const {
    auctionType,
    judicialProcess,
    auctionDetails,
    createdLots = [],
  } = wizardData;

  const auctionTypeLabels: Record<string, string> = {
    JUDICIAL: 'Leilão Judicial',
    EXTRAJUDICIAL: 'Leilão Extrajudicial',
    PARTICULAR: 'Leilão Particular',
    TOMADA_DE_PRECOS: 'Tomada de Preços',
    VENDA_DIRETA: 'Venda Direta',
  };
  const reviewSections = buildWizardReviewSections(auctionDetails);

  const isPublishing = publishMode !== null;

  const handlePublish = async (redirectTo: 'edit' | 'control-center') => {
    setPublishMode(redirectTo);
    try {
      const result = await createAuctionFromWizard(wizardData);
      if (result.success) {
        const redirectTarget = result.auctionId
          ? redirectTo === 'control-center'
            ? `/admin/auctions/${result.auctionId}/auction-control-center`
            : `/admin/auctions/${result.auctionId}/edit`
          : '/admin/auctions';
        toast({
          title: "Leilão Publicado!",
          description: "O leilão e seus lotes foram criados com sucesso.",
        });
        window.location.href = redirectTarget;
      } else {
        toast({
          title: "Erro ao Publicar",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro Crítico ao Publicar",
        description: err.message || "Ocorreu um erro interno. Verifique o console.",
        variant: "destructive",
      });
    } finally {
      setPublishMode(null);
    }
  };


  return (
    <div className="space-y-6" data-ai-id="wizard-step5-review-card">
      <h3 className="text-lg font-semibold mb-4">Revise e Confirme as Informações</h3>
      
      {/* Resumo do Leilão */}
      <Card data-ai-id="wizard-step5-auction-summary-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2"><Gavel className="text-primary"/> Detalhes do Leilão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Título:</strong> <span className="text-muted-foreground">{auctionDetails?.title || 'Não definido'}</span></p>
          <p><strong>Descrição:</strong> <span className="text-muted-foreground">{auctionDetails?.description || 'Não definida'}</span></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-center gap-2"><strong>Modalidade:</strong> <Badge variant="outline">{auctionTypeLabels[auctionType || ''] || 'Não definida'}</Badge></div>
            <p><strong>Leiloeiro:</strong> <span className="text-muted-foreground">{auctionDetails?.auctioneer || 'Não definido'}</span></p>
            <p><strong>Comitente:</strong> <span className="text-muted-foreground">{auctionDetails?.seller || 'Não definido'}</span></p>
            <p><strong>Data de Início:</strong> <span className="text-muted-foreground">{auctionDetails?.auctionDate ? format(new Date(auctionDetails.auctionDate), 'dd/MM/yyyy', {locale: ptBR}) : 'Não definida'}</span></p>
            {auctionDetails?.endDate && (
                <p><strong>Data de Fim:</strong> <span className="text-muted-foreground">{format(new Date(auctionDetails.endDate), 'dd/MM/yyyy', {locale: ptBR})}</span></p>
            )}
          </div>
          <Separator className="my-3"/>
          <AuctionStagesTimeline auctionOverallStartDate={new Date(auctionDetails?.auctionDate || Date.now())} stages={auctionDetails?.auctionStages || []} />
        </CardContent>
      </Card>

      {/* Resumo do Processo Judicial (se aplicável) */}
      {auctionType === 'JUDICIAL' && judicialProcess && (
        <Card data-ai-id="wizard-step5-judicial-summary-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><FileText className="text-primary"/> Processo Judicial Vinculado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Nº do Processo:</strong> <span className="text-muted-foreground">{judicialProcess.processNumber}</span></p>
            <p><strong>Vara:</strong> <span className="text-muted-foreground">{judicialProcess.branchName}</span></p>
            <p><strong>Comarca:</strong> <span className="text-muted-foreground">{judicialProcess.districtName}</span></p>
            <div>
              <strong className="flex items-center gap-1"><Users/>Partes:</strong>
              <ul className="list-disc list-inside pl-4 text-muted-foreground">
                {judicialProcess.parties.map((party, index) => (
                  <li key={index}><strong>{party.partyType}:</strong> {party.name}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lotes Criados */}
      <Card data-ai-id="wizard-step5-lots-summary-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2"><ListChecks className="text-primary"/> Lotes Criados ({createdLots.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {createdLots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum lote foi criado nesta sessão.</p>
          ) : (
            createdLots.map((lot, index) => (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-semibold">Lote {lot.number}: {lot.title}</p>
                <p className="text-xs text-muted-foreground">
                    {lot.assetIds?.length || 0} ativo(s) | Lance Inicial: R$ {(lot.initialPrice || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card data-ai-id="wizard-step5-support-summary-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Contato e Suporte</CardTitle>
          <CardDescription>Dados públicos de contato confirmados antes da publicação.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewItemList items={reviewSections.support} testId="wizard-step5-support-summary-items" />
        </CardContent>
      </Card>

      <Card data-ai-id="wizard-step5-documents-summary-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Documentos e Referências</CardTitle>
          <CardDescription>URLs e vínculos documentais informados no formulário.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewItemList items={reviewSections.documents} testId="wizard-step5-documents-summary-items" />
        </CardContent>
      </Card>

      <Card data-ai-id="wizard-step5-bidding-summary-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Regras de Lance e Opções</CardTitle>
          <CardDescription>Configurações comerciais que impactam a disputa e o checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewItemList items={reviewSections.bidding} testId="wizard-step5-bidding-summary-items" />
        </CardContent>
      </Card>
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-dashed border-green-500 rounded-lg">
          <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2"/>
          <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">Tudo Pronto para Publicar!</h4>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
             Ao clicar em &quot;Publicar Leilão&quot;, o leilão e todos os lotes criados serão salvos no banco de dados.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="outline" onClick={() => handlePublish('edit')} disabled={isPublishing}>
              {publishMode === 'edit' ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 h-5 w-5" />}
              {publishMode === 'edit' ? 'Publicando...' : 'Publicar e revisar edição'}
            </Button>
            <Button size="lg" onClick={() => handlePublish('control-center')} disabled={isPublishing}>
              {publishMode === 'control-center' ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 h-5 w-5" />}
              {publishMode === 'control-center' ? 'Publicando...' : 'Publicar e abrir central'}
            </Button>
          </div>
      </div>
    </div>
  );
}
