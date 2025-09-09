// apps/web/src/app/admin/sellers/[sellerId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SellerForm } from '@/app/admin/sellers/seller-form';
import { getSeller, updateSeller, deleteSeller } from '@/app/admin/sellers/actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { BarChart3, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSellerDashboardDataAction } from '@/app/admin/sellers/analysis/actions';
import type { SellerDashboardData, SellerFormData } from '@bidexpert/core';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';
import FormPageLayout from '@/components/admin/form-page-layout'; 

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
    const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const data = await getSellerDashboardDataAction(sellerId);
            setDashboardData(data);
            setIsLoading(false);
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
        <div className="space-y-4">
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

export default function EditSellerPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [judicialBranches, setJudicialBranches] = useState<any[]>([]);

  useEffect(() => {
    getJudicialBranches().then(setJudicialBranches);
  }, []);

  const handleUpdate = async (data: SellerFormData) => {
    const result = await updateSeller(sellerId, data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Comitente atualizado.' });
    } else {
      toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    // O FormPageLayout irá recarregar os dados se a lógica for movida para lá
  };
  
  const handleDelete = async () => {
    const result = await deleteSeller(sellerId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/sellers');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6" data-ai-id={`admin-seller-edit-page-${sellerId}`}>
      <FormPageLayout
        pageTitle="Editar Comitente"
        pageDescription="Atualize os dados do comitente/vendedor."
        icon={Users}
        fetchAction={() => getSeller(sellerId)}
        deleteAction={handleDelete}
        isEdit={true}
        entityId={sellerId}
      >
        {(formRef, initialData) => (
            <SellerForm
                ref={formRef}
                initialData={initialData}
                judicialBranches={judicialBranches}
                onSubmitAction={handleUpdate}
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
                  KPIs e métricas de desempenho para este comitente.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <SellerDashboardSection sellerId={sellerId} />
          </CardContent>
      </Card>
    </div>
  );
}
