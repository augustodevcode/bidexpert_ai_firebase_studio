// apps/web/src/app/admin/sellers/[sellerId]/edit/page.tsx
'use client';

import React, { useCallback } from 'react';
import SellerForm from '@/app/admin/sellers/seller-form';
import { getSeller, updateSeller, deleteSeller } from '@/app/admin/sellers/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Users, BarChart3, Loader2, DollarSign, TrendingUp, Gavel, ListChecks } from 'lucide-react';
import type { SellerDashboardData, SellerFormData, JudicialBranch } from '@bidexpert/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSellerDashboardDataAction } from '@/app/admin/sellers/analysis/actions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

function SellerDashboardSection({ sellerId }: { sellerId: string }) {
    const [dashboardData, setDashboardData] = React.useState<SellerDashboardData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const data = await getSellerDashboardDataAction(sellerId);
                setDashboardData(data);
            } catch (error) {
                console.error("Failed to fetch seller dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [sellerId]);
    
    if (isLoading) {
        return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>;
    }
    
    if (!dashboardData) {
        return <p>Não foi possível carregar os dados de performance.</p>;
    }
    
    const { totalRevenue, salesRate, totalAuctions, totalLots, salesByMonth } = dashboardData;
    
    return (
        <div className="space-y-4" data-ai-id="seller-dashboard-section">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <StatCard title="Faturamento Bruto" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
                <StatCard title="Taxa de Venda" value={`${salesRate.toFixed(1)}%`} icon={TrendingUp} />
                <StatCard title="Total de Leilões" value={totalAuctions} icon={Gavel} />
                <StatCard title="Total de Lotes" value={totalLots} icon={ListChecks} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Faturamento Mensal</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                     <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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


export default function EditSellerPage({ params }: { params: { sellerId: string } }) {
  const [judicialBranches, setJudicialBranches] = React.useState<JudicialBranch[]>([]);

  React.useEffect(() => {
    getJudicialBranches().then(setJudicialBranches);
  }, []);

  const handleUpdate = useCallback(async (id: string, data: SellerFormData) => {
    return updateSeller(id, data);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    return deleteSeller(id);
  }, []);


  return (
    <div className="space-y-6" data-ai-id={`admin-seller-edit-page-${params.sellerId}`}>
      <FormPageLayout
        pageTitle="Comitente"
        fetchAction={() => getSeller(params.sellerId)}
        deleteAction={() => handleDelete(params.sellerId)}
        entityId={params.sellerId}
        entityName="Comitente"
        routeBase="/admin/sellers"
        icon={Users}
        isEdit={true}
      >
        {(initialData, formRef, handleSubmit) => (
            <SellerForm
                ref={formRef}
                initialData={initialData}
                judicialBranches={judicialBranches}
                onSubmitAction={(data) => handleSubmit(async () => handleUpdate(params.sellerId, data))}
            />
        )}
      </FormPageLayout>

      <Separator className="my-8" />
       <Card data-ai-id="seller-performance-analysis-card">
          <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary"/> Análise de Performance
              </CardTitle>
              <CardDescription>
                  KPIs e métricas de desempenho para este comitente.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <SellerDashboardSection sellerId={params.sellerId} />
          </CardContent>
      </Card>
    </div>
  );
}
