// src/app/admin/auctioneers/[auctioneerId]/edit/page.tsx
'use client';

import React, { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Gavel, BarChart3, Users, DollarSign, TrendingUp, ListChecks } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';
import type { AuctioneerDashboardData, AuctioneerFormData } from '@bidexpert/core';
import FormPageLayout from '@/components/admin/form-page-layout';
import { getAuctioneer, updateAuctioneer, deleteAuctioneer } from '@/app/admin/auctioneers/actions';
import { getAuctioneerDashboardDataAction } from '@/app/admin/auctioneers/analysis/actions';
import AuctioneerForm from '@/app/admin/auctioneers/auctioneer-form';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="bg-secondary/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

function AuctioneerDashboardSection({ auctioneerId }: { auctioneerId: string }) {
    const [dashboardData, setDashboardData] = React.useState<AuctioneerDashboardData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const data = await getAuctioneerDashboardDataAction(auctioneerId);
                setDashboardData(data);
            } catch (error) {
                console.error("Failed to fetch auctioneer dashboard data:", error);
                setDashboardData(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [auctioneerId]);

    if (isLoading) {
        return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>;
    }
    
    if (!dashboardData) {
        return <p>Não foi possível carregar os dados de performance.</p>;
    }
    
    return (
        <div className="space-y-4">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Faturamento Bruto" value={dashboardData.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
                <StatCard title="Taxa de Venda" value={`${dashboardData.salesRate.toFixed(1)}%`} icon={TrendingUp} />
                <StatCard title="Total de Leilões" value={dashboardData.totalAuctions} icon={Gavel} />
                <StatCard title="Total de Lotes" value={dashboardData.totalLots} icon={ListChecks} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Faturamento Mensal</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                     <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.salesByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                        <Legend />
                        <Line type="monotone" dataKey="Faturamento" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}

export default function EditAuctioneerPage({ params }: { params: { auctioneerId: string } }) {

  const handleUpdate = useCallback(async (id: string, data: AuctioneerFormData) => {
    return updateAuctioneer(id, data);
  }, []);

  return (
    <div className="space-y-6" data-ai-id={`admin-auctioneer-edit-page-${params.auctioneerId}`}>
      <FormPageLayout
        pageTitle="Leiloeiro"
        fetchAction={() => getAuctioneer(params.auctioneerId)}
        deleteAction={deleteAuctioneer}
        entityId={params.auctioneerId}
        entityName="Leiloeiro"
        routeBase="/admin/auctioneers"
        icon={Gavel}
      >
        {(initialData) => (
          <AuctioneerForm
            initialData={initialData}
            onSubmitAction={(data) => handleUpdate(params.auctioneerId, data)}
          />
        )}
      </FormPageLayout>

      <Separator className="my-8" />
       <Card>
          <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary"/> Análise de Performance
              </CardTitle>
              <CardDescription>
                  KPIs e métricas de desempenho para este leiloeiro.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <AuctioneerDashboardSection auctioneerId={params.auctioneerId} />
          </CardContent>
      </Card>
    </div>
  );
}
