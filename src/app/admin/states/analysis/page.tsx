// src/app/admin/states/analysis/page.tsx
'use client';

import { BarChart as BarChartIcon, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getStatesPerformanceAction, type StatePerformanceData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, MapPin, Loader2, Package, TrendingUp, Tag, Building2 as City } from 'lucide-react'; // Corrigido: 'City' substituído por 'Building2'
import { createColumns } from './columns';

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

export default function StateAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<StatePerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getStatesPerformanceAction();
      setPerformanceData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createColumns(), []);
  
  const chartData = useMemo(() => {
    return performanceData
        .slice(0, 10) // Top 10 states
        .map(item => ({ name: item.uf, Faturamento: item.totalRevenue }));
  }, [performanceData]);
  
  const { totalRevenue, totalLotsSoldCount, topCategory, topCity } = useMemo(() => {
    if (performanceData.length === 0) return { totalRevenue: 0, totalLotsSoldCount: 0, topCategory: 'N/A', topCity: 'N/A' };
    
    const totalRevenue = performanceData.reduce((acc, item) => acc + item.totalRevenue, 0);
    const totalLotsSoldCount = performanceData.reduce((acc, item) => acc + item.lotsSoldCount, 0);

    const categoryCounts = performanceData.reduce((acc, item) => {
        acc[item.mostValuableCategory] = (acc[item.mostValuableCategory] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topCategory = Object.entries(categoryCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const cityCounts = performanceData.reduce((acc, item) => {
        acc[item.cityWithHighestRevenue] = (acc[item.cityWithHighestRevenue] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topCity = Object.entries(cityCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    return { totalRevenue, totalLotsSoldCount, topCategory, topCity };
  }, [performanceData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando análise...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <MapPin className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance por Estado
          </CardTitle>
          <CardDescription>
            Visão geral do desempenho de vendas e atividade por Estado (UF).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
        <StatCard title="Lotes Vendidos" value={totalLotsSoldCount.toLocaleString('pt-BR')} icon={Package} />
        <StatCard title="Principal Categoria" value={topCategory} icon={Tag} />
        <StatCard title="Principal Cidade" value={topCity} icon={City} />
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Top 10 Estados por Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
            <BarChartIcon data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Legend />
                <Bar dataKey="Faturamento" fill="hsl(var(--primary))" />
            </BarChartIcon>
            </ResponsiveContainer>
        </CardContent>
       </Card>

       <Card>
         <CardHeader>
            <CardTitle>Dados Detalhados por Estado</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="name"
                searchPlaceholder="Buscar estado..."
            />
         </CardContent>
       </Card>
    </div>
  );
}
