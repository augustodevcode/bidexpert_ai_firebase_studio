// src/app/admin/reports/audit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerCrash, AlertTriangle, CheckCircle, Package, Gavel, FileX, Ban, ListTodo, Boxes, Edit, MapPin, Search, HelpCircle, FileSignature, RefreshCw, ImageOff, Link as LinkIcon } from 'lucide-react';
import { getAuditDataAction, type AuditData } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => (
  <Card className={value > 0 ? 'border-destructive bg-destructive/10' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const InconsistentAccordion = ({ title, data, entityPath, message, idField = 'id', publicIdField = 'publicId' }: { title: string, data: any[], entityPath: string, message: string, idField?: string, publicIdField?: string }) => {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive"/>
                    {title} ({data.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {data.map(item => (
                        <AccordionItem value={item[idField]} key={item[idField]}>
                            <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <span className="truncate" title={item.title || item.fullName || item.email || item.name || `ID: ${item[idField]}`}>{item.title || item.fullName || item.email || item.name || `ID: ${item[idField]}`}</span>
                                    <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/admin/${entityPath}/${item[publicIdField] || item[idField]}/edit`}>
                                          <Edit className="mr-2 h-3.5 w-3.5"/> Corrigir
                                        </Link>
                                    </Button>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">{message}</p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}

const InconsistentAuctionAccordion = ({ title, data }: { title: string, data: { auction: { id: string; title: string; publicId?: string | null; status: string }; lots: { id: string; title: string; status: string }[] }[] }) => {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-destructive"/>
                    {title} ({data.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {data.map(({ auction, lots }) => (
                         <AccordionItem value={auction.id} key={auction.id}>
                             <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <span className="truncate" title={auction.title}>{auction.title}</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive">{auction.status}</Badge>
                                         <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                            <Link href={`/admin/auctions/${auction.publicId || auction.id}/edit`}>
                                                <Edit className="mr-2 h-3.5 w-3.5"/> Corrigir Leilão
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-2 bg-muted rounded-md space-y-2">
                                     <p className="text-sm font-semibold">Lotes com status inconsistente:</p>
                                     <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {lots.map(lot => (
                                            <li key={lot.id}>
                                                <Link href={`/admin/lots/${lot.id}/edit`} className="hover:underline hover:text-primary">
                                                    {lot.title}
                                                </Link>
                                                <Badge variant="secondary" className="ml-2">{lot.status}</Badge>
                                            </li>
                                        ))}
                                     </ul>
                                </div>
                            </AccordionContent>
                         </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}


export default function AuditPage() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAuditDataAction();
      setAuditData(data);
    } catch (e: any) {
      toast({ title: 'Erro ao buscar dados de auditoria', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !auditData) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando auditoria...</div>;
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
      (auditData?.lotsWithoutQuestions.length || 0) +
      (auditData?.lotsWithoutReviews.length || 0) +
      (auditData?.habilitatedUsersWithoutDocs.length || 0) +
      (auditData?.lotsWithoutImages.length || 0) +
      (auditData?.assetsWithoutImages.length || 0) +
      (auditData?.judicialAuctionsWithoutProcess.length || 0) +
      (auditData?.judicialSellersWithoutBranch.length || 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <ServerCrash className="h-6 w-6 mr-2 text-primary" />
                Painel de Auditoria de Dados
              </CardTitle>
              <CardDescription>
                Monitore a integridade e identifique inconsistências nos cadastros da plataforma.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
        </CardHeader>
      </Card>
      
       <Alert variant={totalInconsistencies > 0 ? "destructive" : "default"} className={totalInconsistencies === 0 ? "bg-green-50 dark:bg-green-900/20 border-green-500/50" : ""}>
          {totalInconsistencies > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
          <AlertTitle className={totalInconsistencies > 0 ? "text-destructive" : "text-green-700 dark:text-green-300"}>
            {totalInconsistencies > 0 ? `${totalInconsistencies} Inconsistência(s) Encontrada(s)` : 'Tudo Certo!'}
          </AlertTitle>
          <AlertDescription>
             {totalInconsistencies > 0 ? 'Foram encontrados problemas na integridade dos dados que requerem sua atenção. Corrija os itens listados abaixo.' : 'Nenhuma inconsistência de dados foi encontrada na plataforma.'}
          </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Leilões sem Lotes" value={auditData?.auctionsWithoutLots.length || 0} icon={Gavel} />
        <StatCard title="Lotes sem Ativos" value={auditData?.lotsWithoutAssets.length || 0} icon={Package} />
        <StatCard title="Leilões sem Etapas" value={auditData?.auctionsWithoutStages.length || 0} icon={ListTodo} />
        <StatCard title="Status Inconsistente" value={(auditData?.closedAuctionsWithOpenLots.length || 0) + (auditData?.canceledAuctionsWithOpenLots.length || 0)} icon={Ban} />
        <StatCard title="Itens sem Imagem" value={(auditData?.assetsWithoutImages.length || 0) + (auditData?.lotsWithoutImages.length || 0)} icon={ImageOff} />
        <StatCard title="Leilões Judiciais s/ Processo" value={auditData?.judicialAuctionsWithoutProcess.length || 0} icon={LinkIcon} />
        <StatCard title="Comitentes Judiciais s/ Vara" value={auditData?.judicialSellersWithoutBranch.length || 0} icon={LinkIcon} />
        <StatCard title="Lotes Encerrados sem Lances" value={auditData?.endedLotsWithoutBids.length || 0} icon={Gavel} />
      </div>
      
      <div className="space-y-4">
        <InconsistentAccordion title="Leilões Sem Lotes Cadastrados" data={auditData?.auctionsWithoutLots || []} entityPath="auctions" message="Este leilão não possui nenhum lote cadastrado. Adicione lotes para que ele possa ser publicado."/>
        <InconsistentAccordion title="Leilões Sem Praças/Etapas Definidas" data={auditData?.auctionsWithoutStages || []} entityPath="auctions" message="Este leilão precisa de pelo menos uma etapa (praça) com datas de início e fim."/>
        <InconsistentAccordion title="Leilões Judiciais sem Vínculo com Processo" data={auditData?.judicialAuctionsWithoutProcess || []} entityPath="auctions" message="Este leilão é do tipo JUDICIAL, mas nenhum processo foi vinculado a ele."/>
        <InconsistentAccordion title="Lotes Sem Ativos Vinculados" data={auditData?.lotsWithoutAssets || []} entityPath="lots" message="Este lote não tem nenhum ativo (bem) vinculado a ele." />
        <InconsistentAccordion title="Lotes Sem Imagem Principal" data={auditData?.lotsWithoutImages || []} entityPath="lots" message="Este lote não possui uma imagem principal definida, o que prejudica sua exibição." />
        <InconsistentAccordion title="Ativos (Bens) Sem Imagem Principal" data={auditData?.assetsWithoutImages || []} entityPath="assets" message="Este ativo não possui uma imagem principal, o que pode impedir que lotes o utilizem como imagem herdada." />
        <InconsistentAccordion title="Comitentes Judiciais sem Vínculo com uma Vara" data={auditData?.judicialSellersWithoutBranch || []} entityPath="sellers" message="Este comitente está marcado como JUDICIAL, mas não está associado a nenhuma vara específica." />
        <InconsistentAuctionAccordion title="Leilões Encerrados/Finalizados com Lotes Abertos" data={auditData?.closedAuctionsWithOpenLots || []} />
        <InconsistentAuctionAccordion title="Leilões Cancelados com Lotes Abertos" data={auditData?.canceledAuctionsWithOpenLots || []} />
        <InconsistentAccordion title="Ativos com Vínculos Obrigatórios Faltando" data={auditData?.assetsWithoutRequiredLinks || []} entityPath="assets" message="Este ativo não possui uma categoria ou um comitente vinculado, dados essenciais para o seu gerenciamento."/>
        <InconsistentAccordion title="Lotes Encerrados sem Nenhum Lance" data={auditData?.endedLotsWithoutBids || []} entityPath="lots" message="Este lote foi encerrado mas não recebeu nenhum lance. Considere relistá-lo ou analisar sua precificação."/>
        <InconsistentAccordion title="Usuários Habilitados sem Documentos" data={auditData?.habilitatedUsersWithoutDocs || []} entityPath="users" message="Este usuário possui status de 'Habilitado', mas não tem nenhum documento cadastrado no sistema. Verifique a integridade do processo de habilitação." idField="id" publicIdField="id" />
      </div>
    </div>
  );
}
