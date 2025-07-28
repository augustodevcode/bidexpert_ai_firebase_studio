// src/app/admin/auctions/analysis/page.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAuctionsPerformanceAction, type AuctionPerformanceData, analyzeAuctionDataAction } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, Gavel, Loader2, Package, TrendingUp, BarChart3, TrendingDown, BrainCircuit } from 'lucide-react';
import { createAuctionAnalysisColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: AuctionPerformanceData[], isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData.length > 0) {
            setIsLoadingAI(true);
            analyzeAuctionDataAction({ performanceData })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA no momento.");
                })
                .finally(() => setIsLoadingAI(false));
        }
    }, [performanceData, isLoading]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-primary"/> Análise e Recomendações da IA
                </CardTitle>
                <CardDescription>
                    Insights gerados por IA com base nos dados de performance dos leilões.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando dados e gerando insights...</span>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground whitespace-pre-line bg-secondary/40 p-4 rounded-md">
                        {analysis || "Nenhuma análise disponível."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AuctionAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<AuctionPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getAuctionsPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createAuctionAnalysisColumns(), []);
  
  const topAuctionsByRevenue = useMemo(() => {
    return [...performanceData]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)
        .map(item => ({ name: item.title, Faturamento: item.totalRevenue }));
  }, [performanceData]);
  
  const { totalRevenue, activeAuctions, totalLotsSold } = useMemo(() => {
    return performanceData.reduce((acc, item) => {
        acc.totalRevenue += item.totalRevenue;
        if(item.status === 'ABERTO_PARA_LANCES') acc.activeAuctions += 1;
        acc.totalLotsSold += item.lotsSoldCount;
        return acc;
    }, { totalRevenue: 0, activeAuctions: 0, totalLotsSold: 0 });
  }, [performanceData]);

  const statusOptions = useMemo(() => 
    [...new Set(performanceData.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [performanceData]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
  ], [statusOptions]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando análise...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance de Leilões
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho dos leilões na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes vendidos" isLoading={isLoading} />
        <StatCard title="Leilões Ativos" value={activeAuctions} icon={Gavel} description="Leilões abertos para lances" isLoading={isLoading} />
        <StatCard title="Lotes Vendidos" value={totalLotsSold} icon={Package} description="Total de lotes arrematados" isLoading={isLoading} />
        <StatCard title="Leilões Realizados" value={performanceData.length} icon={TrendingUp} description="Total de leilões cadastrados" isLoading={isLoading} />
      </div>
      
      <AIAnalysisSection performanceData={performanceData} isLoading={isLoading} />

       <Card>
        <CardHeader>
            <CardTitle>Top 10 Leilões por Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAuctionsByRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} interval={0} tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Legend />
                <Bar dataKey="Faturamento" fill="hsl(var(--primary))" />
            </BarChart>
            </ResponsiveContainer>
        </CardContent>
       </Card>

       <Card>
         <CardHeader>
            <CardTitle>Dados Detalhados por Leilão</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="title"
                searchPlaceholder="Buscar leilão..."
                facetedFilterColumns={facetedFilterColumns}
            />
         </CardContent>
       </Card>
    </div>
  );
}
