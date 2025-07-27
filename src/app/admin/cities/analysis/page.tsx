// src/app/admin/cities/analysis/page.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCitiesPerformanceAction, type CityPerformanceData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, MapPin, Loader2, Package, TrendingUp, BarChart3 } from 'lucide-react';
import { createCityAnalysisColumns } from './columns';

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
  
  const { totalLots, totalRevenue, statesCount } = useMemo(() => {
    return performanceData.reduce((acc, item) => {
        acc.totalLots += item.totalLots;
        acc.totalRevenue += item.totalRevenue;
        acc.stateUfs.add(item.stateUf);
        return acc;
    }, { totalLots: 0, totalRevenue: 0, stateUfs: new Set<string>() });
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
            Análise de Performance por Cidade
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho de vendas e atividade por cidade.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes vendidos" isLoading={isLoading} />
        <StatCard title="Cidades com Atividade" value={performanceData.length} icon={MapPin} description="Cidades com lotes cadastrados" isLoading={isLoading} />
        <StatCard title="Total de Lotes" value={totalLots} icon={Package} description="Lotes em todas as cidades" isLoading={isLoading} />
        <StatCard title="Estados Atendidos" value={statesCount.size} icon={TrendingUp} description="UFs com atividade" isLoading={isLoading} />
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Top 10 Cidades por Faturamento</CardTitle>
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
