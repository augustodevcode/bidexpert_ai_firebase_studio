// src/app/consignor-dashboard/reports/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    DollarSign, 
    Gavel, 
    Tag, 
    BarChart3, 
    Loader2,
    TrendingUp,
    ListChecks
} from 'lucide-react';
import { 
    LineChart as ReLineChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    Line, 
} from 'recharts';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getConsignorDashboardStatsAction } from './actions';
import type { ConsignorDashboardStats } from '@/types';

const initialStats: ConsignorDashboardStats = {
  totalLotsConsigned: 0,
  activeLots: 0,
  soldLots: 0,
  totalSalesValue: 0,
  salesRate: 0,
  salesData: [],
};

export default function ConsignorReportsPage() {
    const { userProfileWithPermissions, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<ConsignorDashboardStats>(initialStats);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async (sellerId: string) => {
        setIsLoading(true);
        try {
            const fetchedStats = await getConsignorDashboardStatsAction(sellerId);
            setStats(fetchedStats);
        } catch (error) {
            console.error("Failed to fetch consignor stats", error);
            // Optionally set an error state to display to the user
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const sellerId = userProfileWithPermissions?.sellerId;
        if (!authLoading && sellerId) {
            fetchStats(sellerId);
        } else if (!authLoading) {
            // Handle case where user is not a consignor or profile is not loaded
            setIsLoading(false);
        }
    }, [userProfileWithPermissions, authLoading, fetchStats]);


    if (isLoading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
  
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-primary" />
            Meus Relatórios de Desempenho
          </CardTitle>
          <CardDescription>
            Acompanhe a performance de seus itens na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Bruto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">R$ {stats.totalSalesValue.toLocaleString('pt-BR')}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Lotes Vendidos</CardTitle>
                <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">+{stats.soldLots}</div></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.salesRate.toFixed(1)}%</div></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.activeLots}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><ReLineChart className="mr-2 h-5 w-5"/> Vendas Mensais (Últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={stats.salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                <Legend />
                <Line type="monotone" dataKey="Sales" name="Suas Vendas" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
              </ReLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
