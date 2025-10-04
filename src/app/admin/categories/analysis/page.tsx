// src/app/admin/categories/analysis/page.tsx
/**
 * @fileoverview Página do painel de administração para análise de performance de Categorias.
 * Exibe um dashboard com cartões de estatísticas (KPIs), um gráfico de barras com
 * o faturamento das principais categorias e uma tabela detalhada com os dados,
 * além de uma análise gerada por IA.
 */
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCategoriesPerformanceAction, type CategoryPerformanceData } from './actions';
import { analyzeAuctionDataAction } from '@/app/admin/auctions/analysis/actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, Tag, Loader2, ListChecks, TrendingUp, BarChart3, BrainCircuit } from 'lucide-react';
import { createCategoryAnalysisColumns } from './columns';
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

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: CategoryPerformanceData[], isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData.length > 0) {
            setIsLoadingAI(true);
            const dataForAI = performanceData.map(({ id, ...rest }) => ({...rest, title: rest.name}));
            analyzeAuctionDataAction({ performanceData: dataForAI })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis for Categories failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA para as categorias no momento.");
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
                    Insights gerados por IA com base nos dados de performance das categorias.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando dados das categorias...</span>
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

export default function CategoryAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<CategoryPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getCategoriesPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createCategoryAnalysisColumns(), []);
  
  const chartData = useMemo(() => {
    return performanceData
        .slice(0, 10) // Top 10 categories
        .map(item => ({ name: item.name, Faturamento: item.totalRevenue }));
  }, [performanceData]);
  
  const { totalRevenue, totalLotsSoldCount, topCategory, topTicket } = useMemo(() => {
    const totalRevenue = performanceData.reduce((acc, item) => acc + item.totalRevenue, 0);
    const totalLotsSoldCount = performanceData.reduce((acc, item) => acc + item.totalLotsSold, 0);
    const topCategory = performanceData[0]?.name || 'N/A';
    const topTicket = [...performanceData].sort((a,b) => b.averageTicket - a.averageTicket)[0]?.name || 'N/A';
    return { totalRevenue, totalLotsSoldCount, topCategory, topTicket };
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
            Análise de Performance de Categorias
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho de cada categoria de lote na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes vendidos" isLoading={isLoading} />
        <StatCard title="Total Lotes Vendidos" value={totalLotsSoldCount} icon={ListChecks} description="Unidades vendidas em todas as categorias" isLoading={isLoading} />
        <StatCard title="Categoria Mais Rentável" value={topCategory} icon={Tag} description="Maior faturamento bruto" isLoading={isLoading} />
        <StatCard title="Categoria Maior Ticket Médio" value={topTicket} icon={TrendingUp} description="Maior valor médio por lote" isLoading={isLoading} />
      </div>

       <AIAnalysisSection performanceData={performanceData} isLoading={isLoading} />

       <Card>
        <CardHeader>
            <CardTitle>Top 10 Categorias por Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
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
            <CardTitle>Dados Detalhados por Categoria</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                isLoading={isLoading}
                searchColumnId="name"
                searchPlaceholder="Buscar categoria..."
            />
         </CardContent>
       </Card>
    </div>
  );
}
