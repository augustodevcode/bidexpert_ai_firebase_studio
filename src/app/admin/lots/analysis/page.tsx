// src/app/admin/lots/analysis/page.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getLotsPerformanceAction, type LotPerformanceData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, Gavel, Loader2, Package, TrendingUp, BarChart3, TrendingDown, BrainCircuit } from 'lucide-react';
import { createLotAnalysisColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { analyzeAuctionDataAction } from '@/app/admin/auctions/analysis/actions';

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

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: LotPerformanceData[], isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData.length > 0) {
            setIsLoadingAI(true);
            const dataForAI = performanceData.map(lot => ({
                title: lot.title,
                status: lot.status,
                totalLots: 1, // Each lot is a single item for analysis
                lotsSoldCount: lot.status === 'VENDIDO' ? 1 : 0,
                totalRevenue: lot.price,
                averageTicket: lot.price,
                salesRate: lot.status === 'VENDIDO' ? 100 : 0
            }));

            analyzeAuctionDataAction({ performanceData: dataForAI })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis for Lots failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA para os lotes no momento.");
                })
                .finally(() => setIsLoadingAI(false));
        }
    }, [performanceData, isLoading]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-primary"/> Análise de Lotes (IA)
                </CardTitle>
                <CardDescription>
                    Insights gerados por IA com base na performance e popularidade dos lotes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando dados dos lotes...</span>
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

export default function LotAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<LotPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getLotsPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createLotAnalysisColumns(), []);
  
  const topLotsByBids = useMemo(() => {
    return [...performanceData]
        .sort((a, b) => (b.bidsCount || 0) - (a.bidsCount || 0))
        .slice(0, 10)
        .map(item => ({ name: `#${item.number} - ${item.title.substring(0, 20)}...`, Lances: item.bidsCount }));
  }, [performanceData]);
  
  const { totalRevenue, totalLots, totalBids, averageTicket } = useMemo(() => {
    const soldLots = performanceData.filter(item => item.status === 'VENDIDO');
    const totalRevenue = soldLots.reduce((acc, item) => acc + item.price, 0);
    const totalLots = performanceData.length;
    const totalBids = performanceData.reduce((acc, item) => acc + (item.bidsCount || 0), 0);
    const averageTicket = soldLots.length > 0 ? totalRevenue / soldLots.length : 0;
    return { totalRevenue, totalLots, totalBids, averageTicket };
  }, [performanceData]);

  const statusOptions = useMemo(() => 
    [...new Set(performanceData.map(l => l.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [performanceData]);
  
  const categoryOptions = useMemo(() => 
    [...new Set(performanceData.map(l => l.categoryName))]
      .map(cat => ({ value: cat, label: cat })),
  [performanceData]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'categoryName', title: 'Categoria', options: categoryOptions },
  ], [statusOptions, categoryOptions]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando análise de lotes...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance de Lotes
          </CardTitle>
          <CardDescription>
            Visão geral da performance de todos os lotes na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes vendidos" isLoading={isLoading} />
        <StatCard title="Total de Lotes" value={totalLots} icon={Package} description="Total de lotes cadastrados" isLoading={isLoading} />
        <StatCard title="Total de Lances" value={totalBids} icon={Gavel} description="Total de lances em todos os lotes" isLoading={isLoading} />
        <StatCard title="Ticket Médio (Vendido)" value={averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={TrendingUp} description="Valor médio por lote vendido" isLoading={isLoading} />
      </div>

       <AIAnalysisSection performanceData={performanceData} isLoading={isLoading} />

       <Card>
        <CardHeader>
            <CardTitle>Top 10 Lotes Mais Disputados (por Nº de Lances)</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topLotsByBids} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} lances`} />
                <Legend />
                <Bar dataKey="Lances" fill="hsl(var(--primary))" />
            </BarChart>
            </ResponsiveContainer>
        </CardContent>
       </Card>

       <Card>
         <CardHeader>
            <CardTitle>Dados Detalhados por Lote</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="title"
                searchPlaceholder="Buscar lote..."
                facetedFilterColumns={facetedFilterColumns}
            />
         </CardContent>
       </Card>
    </div>
  );
}
