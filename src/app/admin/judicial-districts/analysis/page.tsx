// src/app/admin/judicial-districts/analysis/page.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDistrictsPerformanceAction, type DistrictPerformanceData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, FileText, Loader2, Gavel, TrendingUp, BarChart3, MapPin, ListChecks } from 'lucide-react';
import { createDistrictAnalysisColumns } from './columns';

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

export default function DistrictAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<DistrictPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getDistrictsPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createDistrictAnalysisColumns(), []);
  
  const chartData = useMemo(() => {
    return performanceData
        .filter(item => item.totalRevenue > 0)
        .slice(0, 10) 
        .map(item => ({ name: `${item.name.substring(0, 15)}...`, Faturamento: item.totalRevenue }));
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
            Análise de Performance por Comarca
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho de cada comarca na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
        <StatCard title="Total de Processos" value={totalProcesses.toLocaleString('pt-BR')} icon={FileText} />
        <StatCard title="Total de Leilões" value={totalAuctions.toLocaleString('pt-BR')} icon={Gavel} />
        <StatCard title="Total de Lotes Vendidos" value={totalLotsSold.toLocaleString('pt-BR')} icon={ListChecks} />
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Top 10 Comarcas por Faturamento</CardTitle>
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
            <CardTitle>Dados Detalhados por Comarca</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="name"
                searchPlaceholder="Buscar comarca..."
            />
         </CardContent>
       </Card>
    </div>
  );
}
