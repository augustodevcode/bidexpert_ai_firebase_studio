// src/app/admin/cities/analysis/page.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCitiesPerformanceAction, type CityPerformanceData } from './actions';
import { analyzeAuctionDataAction } from '@/app/admin/auctions/analysis/actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, MapPin, Loader2, Package, TrendingUp, BarChart3, Map as MapIcon, Globe, BrainCircuit } from 'lucide-react';
import { createCityAnalysisColumns } from './columns';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MapAnalysisComponent = dynamic(() => import('@/components/admin/analysis/map-analysis-component'), {
  loading: () => <Skeleton className="w-full h-[400px] bg-muted" />,
  ssr: false
});

const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-1/2" /> : value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: CityPerformanceData[], isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData.length > 0) {
            setIsLoadingAI(true);
            const dataForAI = performanceData.map(({ id, latitude, longitude, ...rest }) => ({...rest, title: rest.name}));
            analyzeAuctionDataAction({ performanceData: dataForAI })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis for Cities failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA para as cidades no momento.");
                })
                .finally(() => setIsLoadingAI(false));
        }
    }, [performanceData, isLoading]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-primary"/> Análise Geográfica (IA)
                </CardTitle>
                <CardDescription>
                    Insights gerados por IA com base no desempenho de vendas por cidade.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando dados geográficos...</span>
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


export default function CityAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<CityPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getCitiesPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createCityAnalysisColumns(), []);
  
  const chartData = useMemo(() => {
    return performanceData
        .slice(0, 10) // Top 10 cities
        .map(item => ({ name: `${item.name} - ${item.stateUf}`, Faturamento: item.totalRevenue }));
  }, [performanceData]);
  
  const { totalLots, totalRevenue, stateUfs } = useMemo(() => {
    return performanceData.reduce((acc, item) => {
        acc.totalLots += item.totalLots;
        acc.totalRevenue += item.totalRevenue;
        acc.stateUfs.add(item.stateUf);
        return acc;
    }, { totalLots: 0, totalRevenue: 0, stateUfs: new Set<string>() });
  }, [performanceData]);
  
  const mapPoints = useMemo(() => {
      return performanceData.filter(d => d.latitude && d.longitude).map(d => ({
          id: d.id,
          lat: d.latitude!,
          lng: d.longitude!,
          popupContent: `<strong>${d.name}, ${d.stateUf}</strong><br/>Receita: R$ ${d.totalRevenue.toLocaleString('pt-BR')}<br/>Lotes: ${d.totalLots}`,
          value: d.totalRevenue,
      }));
  }, [performanceData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando análise...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Globe className="h-6 w-6 mr-2 text-primary" />
            Análise Geográfica por Cidade
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho de vendas e atividade por cidade no mapa e em gráficos.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes vendidos" isLoading={isLoading} />
        <StatCard title="Cidades com Atividade" value={performanceData.length} icon={MapPin} description="Cidades com lotes cadastrados" isLoading={isLoading} />
        <StatCard title="Total de Lotes" value={totalLots} icon={Package} description="Lotes em todas as cidades" isLoading={isLoading} />
        <StatCard title="Estados Atendidos" value={stateUfs.size} icon={TrendingUp} description="UFs com atividade" isLoading={isLoading} />
      </div>

       <AIAnalysisSection performanceData={performanceData} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center"><MapIcon className="h-5 w-5 mr-2 text-primary"/>Mapa de Faturamento</CardTitle>
              </CardHeader>
              <CardContent className="h-96 w-full p-0">
                  <MapAnalysisComponent points={mapPoints} />
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle  className="flex items-center"><BarChart3 className="h-5 w-5 mr-2 text-primary"/>Top 10 Cidades por Faturamento</CardTitle>
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
        </div>

       <Card>
         <CardHeader>
            <CardTitle>Dados Detalhados por Cidade</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="name"
                searchPlaceholder="Buscar cidade..."
            />
         </CardContent>
       </Card>
    </div>
  );
}
