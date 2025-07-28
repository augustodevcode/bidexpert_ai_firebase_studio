// src/app/admin/courts/analysis/page.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCourtsPerformanceAction, type CourtPerformanceData } from './actions';
import { analyzeAuctionDataAction } from '@/app/admin/auctions/analysis/actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, FileText, Loader2, Gavel, TrendingUp, BarChart3, Scale, ListChecks, BrainCircuit } from 'lucide-react';
import { createCourtAnalysisColumns } from './columns';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: CourtPerformanceData[], isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData.length > 0) {
            setIsLoadingAI(true);
            const dataForAI = performanceData.map(({ id, ...rest }) => ({...rest, title: rest.name}));
            analyzeAuctionDataAction({ performanceData: dataForAI })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis for Courts failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA para os tribunais no momento.");
                })
                .finally(() => setIsLoadingAI(false));
        }
    }, [performanceData, isLoading]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-primary"/> Análise Judicial (IA)
                </CardTitle>
                <CardDescription>
                    Insights gerados por IA com base na performance de vendas por tribunal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando dados dos tribunais...</span>
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

export default function CourtAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<CourtPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getCourtsPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createCourtAnalysisColumns(), []);
  
  const chartData = useMemo(() => {
    return performanceData
        .filter(item => item.totalRevenue > 0)
        .slice(0, 10) 
        .map(item => ({ name: item.name.replace("Tribunal de Justiça de", "TJ"), Faturamento: item.totalRevenue }));
  }, [performanceData]);
  
  const { totalRevenue, totalProcesses, totalAuctions, totalLotsSold } = useMemo(() => {
    return performanceData.reduce((acc, item) => {
        acc.totalRevenue += item.totalRevenue;
        acc.totalProcesses += item.totalProcesses;
        acc.totalAuctions += item.totalAuctions;
        acc.totalLotsSold += item.totalLotsSold;
        return acc;
    }, { totalRevenue: 0, totalProcesses: 0, totalAuctions: 0, totalLotsSold: 0 });
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
            Análise de Performance por Tribunal
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho de cada Tribunal de Justiça parceiro.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
        <StatCard title="Total de Processos" value={totalProcesses.toLocaleString('pt-BR')} icon={FileText} />
        <StatCard title="Total de Leilões" value={totalAuctions.toLocaleString('pt-BR')} icon={Gavel} />
        <StatCard title="Total de Lotes Vendidos" value={totalLotsSold.toLocaleString('pt-BR')} icon={ListChecks} />
      </div>
      
      <AIAnalysisSection performanceData={performanceData} isLoading={isLoading}/>

       <Card>
        <CardHeader>
            <CardTitle>Top Tribunais por Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
            <CardTitle>Dados Detalhados por Tribunal</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="name"
                searchPlaceholder="Buscar tribunal..."
            />
         </CardContent>
       </Card>
    </div>
  );
}
