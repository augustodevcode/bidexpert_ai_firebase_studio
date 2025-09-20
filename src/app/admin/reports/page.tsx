// src/app/admin/reports/page.tsx
/**
 * @fileoverview Componente de cliente para a página de Relatórios Gerais.
 * Este componente busca e exibe as principais métricas de desempenho (KPIs)
 * da plataforma, como faturamento, número de usuários e leilões, em cartões
 * de estatísticas e gráficos de vendas e categorias, fornecendo uma visão
 * geral da saúde do negócio.
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    LineChart as LineChartIcon, 
    PieChart as PieChartIcon, 
    Users, 
    DollarSign, 
    Gavel, 
    ListChecks as LotsIcon, 
    BarChart3, 
    Loader2,
    TrendingUp,
    CircleDollarSign,
    Package
} from 'lucide-react';
import { 
    LineChart, 
    PieChart,
    Pie,
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    Line, 
    Cell 
} from 'recharts';
import { useState, useEffect } from 'react';
import { getAdminReportDataAction } from './actions';
import type { AdminReportData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const initialStats: AdminReportData = {
  users: 0,
  auctions: 0,
  lots: 0,
  sellers: 0,
  totalRevenue: 0,
  newUsersLast30Days: 0,
  activeAuctions: 0,
  lotsSoldCount: 0,
  salesData: [],
  categoryData: [],
  averageBidValue: 0,
  auctionSuccessRate: 0,
  averageLotsPerAuction: 0,
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

function StatCard({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) {
    return (
        <Card data-ai-id={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-1/2 mb-2" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

export default function AdminReportsPage() {
    const [stats, setStats] = useState<AdminReportData>(initialStats);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
          setIsLoading(true);
          try {
            const fetchedStats = await getAdminReportDataAction();
            setStats(fetchedStats);
          } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
          } finally {
            setIsLoading(false);
          }
        }
        fetchStats();
      }, []);
  
  return (
    <div className="space-y-6" data-ai-id="admin-reports-page-container">
      <Card className="shadow-lg" data-ai-id="admin-reports-header-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-primary" />
            Painel de Relatórios
          </CardTitle>
          <CardDescription>
            Visualize o desempenho e as métricas da plataforma BidExpert.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-ai-id="admin-reports-stats-grid">
        <StatCard 
            title="Faturamento Bruto Total"
            value={stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon={DollarSign}
            description="Total de lotes vendidos"
            isLoading={isLoading}
        />
        <StatCard 
            title="Novos Usuários (30d)"
            value={`+${stats.newUsersLast30Days}`}
            icon={Users}
            description="Novos cadastros no último mês"
            isLoading={isLoading}
        />
         <StatCard 
            title="Leilões Ativos"
            value={stats.activeAuctions}
            icon={Gavel}
            description="Leilões abertos para lances"
            isLoading={isLoading}
        />
         <StatCard 
            title="Total de Lotes Vendidos"
            value={stats.lotsSoldCount}
            icon={LotsIcon}
            description="Desde o início da plataforma"
            isLoading={isLoading}
        />
        <StatCard 
            title="Taxa de Sucesso (Leilões)"
            value={`${stats.auctionSuccessRate?.toFixed(1) || 0}%`}
            icon={TrendingUp}
            description="Leilões com pelo menos um lote vendido."
            isLoading={isLoading}
        />
         <StatCard 
            title="Valor Médio do Lance"
            value={(stats.averageBidValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon={CircleDollarSign}
            description="Valor médio de todos os lances feitos."
            isLoading={isLoading}
        />
        <StatCard 
            title="Média de Lotes por Leilão"
            value={`${stats.averageLotsPerAuction?.toFixed(1) || 0}`}
            icon={Package}
            description="Média de lotes em cada leilão."
            isLoading={isLoading}
        />
        <StatCard 
            title="Usuários Totais"
            value={`${stats.users || 0}`}
            icon={Users}
            description="Total de usuários cadastrados."
            isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" data-ai-id="admin-reports-charts-grid">
        <Card className="shadow-md" data-ai-id="admin-reports-monthly-sales-card">
          <CardHeader>
            <CardTitle className="flex items-center"><LineChartIcon className="mr-2 h-5 w-5"/> Vendas Mensais (Últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                <Legend />
                <Line type="monotone" dataKey="Sales" name="Vendas" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-md" data-ai-id="admin-reports-category-sales-card">
          <CardHeader>
            <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5"/> Lotes Vendidos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={stats.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                         {stats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
