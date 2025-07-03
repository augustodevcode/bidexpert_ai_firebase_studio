

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
import { useRouter } from 'next/navigation';
import { createAuctionFromWizard } from '../actions';

export default function Step5Review() {
  const { wizardData, resetWizard } = useWizard();
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


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
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const result = await createAuctionFromWizard(wizardData);
    if (result.success) {
        toast({
            title: "Leilão Publicado!",
            description: "O leilão e seus lotes foram criados com sucesso.",
        });
        resetWizard();
        router.push(result.auctionId ? `/admin/auctions/${result.auctionId}/edit` : '/admin/auctions');
    } else {
        toast({
            title: "Erro ao Publicar",
            description: result.message,
            variant: "destructive",
        });
        setIsPublishing(false);
    }
  };


  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Revise e Confirme as Informações</h3>
      
      {/* Resumo do Leilão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2"><Gavel className="text-primary"/> Detalhes do Leilão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Título:</strong> <span className="text-muted-foreground">{auctionDetails?.title || 'Não definido'}</span></p>
          <p><strong>Descrição:</strong> <span className="text-muted-foreground">{auctionDetails?.description || 'Não definida'}</span></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <p><strong>Modalidade:</strong> <Badge variant="outline">{auctionTypeLabels[auctionType || ''] || 'Não definida'}</Badge></p>
            <p><strong>Leiloeiro:</strong> <span className="text-muted-foreground">{auctionDetails?.auctioneer || 'Não definido'}</span></p>
            <p><strong>Comitente:</strong> <span className="text-muted-foreground">{auctionDetails?.seller || 'Não definido'}</span></p>
            <p><strong>Data de Início:</strong> <span className="text-muted-foreground">{auctionDetails?.auctionDate ? format(new Date(auctionDetails.auctionDate), 'dd/MM/yyyy', {locale: ptBR}) : 'Não definida'}</span></p>
            {auctionDetails?.endDate && (
                <p><strong>Data de Fim:</strong> <span className="text-muted-foreground">{format(new Date(auctionDetails.endDate), 'dd/MM/yyyy', {locale: ptBR})}</span></p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Processo Judicial (se aplicável) */}
      {auctionType === 'JUDICIAL' && judicialProcess && (
        <Card>
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
      <Card>
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
                <p className="text-xs text-muted-foreground">Lance Inicial: R$ {lot.initialPrice?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                <p className="text-xs text-muted-foreground">{lot.bemIds?.length || 0} bem(ns) agrupado(s).</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-dashed border-green-500 rounded-lg">
          <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2"/>
          <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">Tudo Pronto para Publicar!</h4>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
             Ao clicar em "Publicar Leilão", o leilão e todos os lotes criados serão salvos no banco de dados.
          </p>
          <Button size="lg" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 h-5 w-5" />}
            {isPublishing ? "Publicando..." : "Publicar Leilão"}
          </Button>
      </div>
    </div>
  );
}
