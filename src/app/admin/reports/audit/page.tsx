// src/app/admin/reports/audit/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerCrash, AlertTriangle, CheckCircle, Package, Gavel, FileX, Ban, ListTodo, Boxes } from 'lucide-react';
import { getAuditDataAction, type AuditData } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => (
  <Card className={value > 0 ? 'border-destructive bg-destructive/10' : 'border-green-500 bg-green-50'}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

interface InconsistencyTableProps {
  title: string;
  data: { id: string; title: string; publicId?: string | null }[];
  entityPath: string;
}

const InconsistencyTable: React.FC<InconsistencyTableProps> = ({ title, data, entityPath }) => {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader><CardTitle className="text-base">{title} ({data.length})</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Título</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/admin/${entityPath}/${item.publicId || item.id}/edit`} target="_blank">Corrigir</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

interface InconsistentAuctionTableProps {
  title: string;
  data: { auction: { id: string; title: string; publicId?: string | null; status: string }; lots: { id: string; title: string; status: string }[] }[];
}

const InconsistentAuctionTable: React.FC<InconsistentAuctionTableProps> = ({ title, data }) => {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader><CardTitle className="text-base">{title} ({data.length})</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                 {data.map(({ auction, lots }) => (
                     <div key={auction.id} className="border p-3 rounded-md">
                         <div className="flex justify-between items-center">
                            <p className="font-semibold">{auction.title} (Status: {auction.status})</p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/auctions/${auction.publicId || auction.id}/edit`} target="_blank">Corrigir Leilão</Link>
                            </Button>
                         </div>
                         <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 pl-2">
                             {lots.map(lot => <li key={lot.id}>{lot.title} (Status: {lot.status})</li>)}
                         </ul>
                     </div>
                 ))}
                </div>
            </CardContent>
        </Card>
    )
}


export default function AuditPage() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getAuditDataAction();
        setAuditData(data);
      } catch (e: any) {
        toast({ title: 'Erro ao buscar dados de auditoria', description: e.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando auditoria...</div>;
  }
  
  const totalInconsistencies = 
      (auditData?.auctionsWithoutLots.length || 0) +
      (auditData?.lotsWithoutBens.length || 0) +
      (auditData?.auctionsWithoutStages.length || 0) +
      (auditData?.closedAuctionsWithOpenLots.length || 0) +
      (auditData?.canceledAuctionsWithOpenLots.length || 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <ServerCrash className="h-6 w-6 mr-2 text-primary" />
            Painel de Auditoria de Dados
          </CardTitle>
          <CardDescription>
            Monitore a integridade e identifique inconsistências nos cadastros da plataforma.
          </CardDescription>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Leilões sem Lotes" value={auditData?.auctionsWithoutLots.length || 0} icon={Gavel} />
        <StatCard title="Lotes sem Bens Vinculados" value={auditData?.lotsWithoutBens.length || 0} icon={Package} />
        <StatCard title="Leilões sem Etapas" value={auditData?.auctionsWithoutStages.length || 0} icon={ListTodo} />
        <StatCard title="Leilões Finalizados com Lotes Abertos" value={auditData?.closedAuctionsWithOpenLots.length || 0} icon={Boxes} />
        <StatCard title="Leilões Cancelados com Lotes Abertos" value={auditData?.canceledAuctionsWithOpenLots.length || 0} icon={Ban} />
      </div>
      
      <div className="space-y-4">
        <InconsistencyTable title="Leilões Sem Lotes" data={auditData?.auctionsWithoutLots || []} entityPath="auctions" />
        <InconsistencyTable title="Lotes Sem Bens" data={auditData?.lotsWithoutBens || []} entityPath="lots" />
        <InconsistencyTable title="Leilões Sem Etapas Definidas" data={auditData?.auctionsWithoutStages || []} entityPath="auctions" />
        <InconsistentAuctionTable title="Leilões Encerrados/Finalizados com Lotes Abertos" data={auditData?.closedAuctionsWithOpenLots || []} />
        <InconsistentAuctionTable title="Leilões Cancelados com Lotes Abertos" data={auditData?.canceledAuctionsWithOpenLots || []} />
      </div>

    </div>
  );
}
