// src/app/admin/auctioneers/analysis/page.tsx
/**
 * @fileoverview Página do painel de administração para análise de performance de Leiloeiros.
 * Exibe um dashboard com cartões de estatísticas (KPIs), gráficos de desempenho e
 * uma tabela detalhada com os dados de todos os leiloeiros, além de uma análise gerada por IA.
 */
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAuctioneersPerformanceAction, analyzeAuctioneerDataAction, type AuctioneerPerformanceData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, Gavel, Loader2, Package, TrendingUp, BarChart3, TrendingDown, BrainCircuit } from 'lucide-react';
import { createAuctioneerAnalysisColumns } from './columns';
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

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: AuctioneerPerformanceData[], isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData.length > 0) {
            setIsLoadingAI(true);
            const dataForAI = performanceData.map(({ id, ...rest }) => ({...rest, title: rest.name})); // Adapt 'name' to 'title' for the generic AI prompt
            analyzeAuctioneerDataAction({ performanceData: dataForAI })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis for Auctioneers failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA para os leiloeiros no momento.");
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
                    Insights gerados por IA com base nos dados de performance dos leiloeiros.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando dados dos leiloeiros...</span>
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

export default function AuctioneerAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<AuctioneerPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getAuctioneersPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createAuctioneerAnalysisColumns(), []);
  
  const topAuctioneersByRevenue = useMemo(() => {
    return [...performanceData]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)
        .map(item => ({ name: item.name, Faturamento: item.totalRevenue }));
  }, [performanceData]);
  
  const { totalRevenue, totalAuctions, totalLots } = useMemo(() => {
    return performanceData.reduce((acc, item) => {
        acc.totalRevenue += item.totalRevenue;
        acc.totalAuctions += item.totalAuctions;
        acc.totalLots += item.totalLots;
        return acc;
    }, { totalRevenue: 0, totalAuctions: 0, totalLots: 0 });
  }, [performanceData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando análise...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance de Leiloeiros
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho dos leiloeiros na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes vendidos" isLoading={isLoading} />
        <StatCard title="Total de Leilões" value={totalAuctions} icon={Gavel} description="Leilões conduzidos por todos" isLoading={isLoading} />
        <StatCard title="Total de Lotes" value={totalLots} icon={Package} description="Lotes em todos os leilões" isLoading={isLoading} />
        <StatCard title="Leiloeiros Ativos" value={performanceData.length} icon={TrendingUp} description="Leiloeiros com atividade" isLoading={isLoading} />
      </div>

      <AIAnalysisSection performanceData={performanceData} isLoading={isLoading} />

       <Card>
        <CardHeader>
            <CardTitle>Top 10 Leiloeiros por Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAuctioneersByRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Legend />
                <Bar dataKey="Faturamento" fill="hsl(var(--primary))" />
            </BarChart>
            </ResponsiveContainer>
        </CardContent>
       </Card>

       <Card>
         <CardHeader>
            <CardTitle>Dados Detalhados por Leiloeiro</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="name"
                searchPlaceholder="Buscar leiloeiro..."
            />
         </CardContent>
       </Card>
    </div>
  );
}
