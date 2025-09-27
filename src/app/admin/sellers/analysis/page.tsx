// src/app/admin/sellers/analysis/page.tsx
/**
 * @fileoverview Página do painel de administração para análise de performance de Comitentes (Vendedores).
 * Exibe um dashboard com cartões de estatísticas (KPIs), um gráfico de barras com
 * o faturamento dos principais comitentes, uma tabela detalhada com os dados
 * de todos os comitentes, e uma análise textual gerada por IA.
 */
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSellersPerformanceAction, analyzeSellerDataAction, type SellerPerformanceData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, Gavel, Loader2, Package, Users, TrendingUp, BarChart3, BrainCircuit } from 'lucide-react';
import { createColumns } from './columns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: SellerPerformanceData[], isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData.length > 0) {
            setIsLoadingAI(true);
            const dataForAI = performanceData.map(({ id, ...rest }) => ({...rest, title: rest.name})); // Adapt 'name' to 'title'
            analyzeSellerDataAction({ performanceData: dataForAI })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis for Sellers failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA para os comitentes no momento.");
                })
                .finally(() => setIsLoadingAI(false));
        }
    }, [performanceData, isLoading]);

    return (
        <Card data-ai-id="ai-analysis-section">
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-primary"/> Análise e Recomendações da IA
                </CardTitle>
                <CardDescription>
                    Insights gerados por IA com base nos dados de performance dos comitentes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando dados dos comitentes...</span>
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


export default function SellerAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<SellerPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getSellersPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createColumns(), []);
  
  const topSellersByRevenue = useMemo(() => {
    return [...performanceData]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)
        .map(seller => ({ name: seller.name, Faturamento: seller.totalRevenue }));
  }, [performanceData]);
  
  const { totalRevenue, totalAuctions, totalLots } = useMemo(() => {
    return performanceData.reduce((acc, seller) => {
        acc.totalRevenue += seller.totalRevenue;
        acc.totalAuctions += seller.totalAuctions;
        acc.totalLots += seller.totalLots;
        return acc;
    }, { totalRevenue: 0, totalAuctions: 0, totalLots: 0 });
  }, [performanceData]);

  return (
    <div className="space-y-6" data-ai-id="seller-analysis-page">
      <Card data-ai-id="seller-analysis-header">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance de Comitentes
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho dos comitentes na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-ai-id="seller-analysis-kpi-cards">
        <StatCard title="Faturamento Total (Vendido)" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes vendidos" isLoading={isLoading} />
        <StatCard title="Total de Leilões" value={totalAuctions} icon={Gavel} description="Leilões criados por todos os comitentes" isLoading={isLoading} />
        <StatCard title="Total de Lotes" value={totalLots} icon={Package} description="Lotes cadastrados por todos os comitentes" isLoading={isLoading} />
        <StatCard title="Total de Comitentes" value={performanceData.length} icon={Users} description="Comitentes ativos na plataforma" isLoading={isLoading} />
      </div>
      
      <AIAnalysisSection performanceData={performanceData} isLoading={isLoading} />

       <Card data-ai-id="top-sellers-chart-card">
        <CardHeader>
            <CardTitle>Top 10 Comitentes por Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            {isLoading ? <Skeleton className="h-full w-full" /> : 
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSellersByRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                <Legend />
                <Bar dataKey="Faturamento" fill="hsl(var(--primary))" />
            </BarChart>
            </ResponsiveContainer>
            }
        </CardContent>
       </Card>

       <Card data-ai-id="sellers-data-table-card">
         <CardHeader>
            <CardTitle>Dados Detalhados por Comitente</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                isLoading={isLoading}
                searchColumnId="name"
                searchPlaceholder="Buscar comitente..."
            />
         </CardContent>
       </Card>
    </div>
  );
}
