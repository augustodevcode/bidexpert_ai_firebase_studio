// src/app/admin/auctioneers/[auctioneerId]/edit/page.tsx
/**
 * @fileoverview Página para edição e visualização de um Leiloeiro específico.
 * Permite alternar entre o modo de visualização e o modo de edição dos dados
 * do leiloeiro através do `FormPageLayout`. Também exibe um dashboard de
 * performance individual para o leiloeiro selecionado.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AuctioneerForm from '../../auctioneer-form';
import { getAuctioneer, updateAuctioneer, deleteAuctioneer, type AuctioneerFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Gavel, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuctioneerDashboardDataAction } from '../../analysis/actions';
import type { AuctioneerDashboardData } from '@/services/auctioneer.service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LineChart, BarChart as RechartsBarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

function AuctioneerDashboardSection({ auctioneerId }: { auctioneerId: string }) {
    const [dashboardData, setDashboardData] = useState<AuctioneerDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const data = await getAuctioneerDashboardDataAction(auctioneerId);
                setDashboardData(data);
            } catch (e) {
                console.error("Failed to fetch auctioneer dashboard data:", e);
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
        return <p>Não foi possível carregar os dados de performance para este leiloeiro.</p>;
    }
    
    return (
        <div className="space-y-4">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Faturamento Bruto" value={dashboardData.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Gavel} />
                <StatCard title="Taxa de Venda" value={`${dashboardData.salesRate.toFixed(1)}%`} icon={Gavel} />
                <StatCard title="Total de Leilões" value={dashboardData.totalAuctions} icon={Gavel} />
                <StatCard title="Total de Lotes" value={dashboardData.totalLots} icon={Gavel} />
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Faturamento Mensal</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={dashboardData.salesByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                            <YAxis stroke="#888888" fontSize={10} tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                            <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                            <Legend />
                            <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}

export default function EditAuctioneerPage() {
  const params = useParams();
  const auctioneerId = params.auctioneerId as string;
  const router = useRouter();
  
  const [auctioneer, setAuctioneer] = useState<AuctioneerFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  
  const fetchPageData = useCallback(async () => {
    if (!auctioneerId) return;
    setIsLoading(true);
    try {
        const fetchedAuctioneer = await getAuctioneer(auctioneerId);
        if (!fetchedAuctioneer) {
            notFound();
            return;
        }
        setAuctioneer(fetchedAuctioneer);
    } catch(e) {
        console.error("Failed to fetch auctioneer", e);
        toast({title: "Erro", description: "Falha ao buscar dados do leiloeiro.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [auctioneerId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: AuctioneerFormData) => {
    setIsSubmitting(true);
    const result = await updateAuctioneer(auctioneerId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Leiloeiro atualizado.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    const result = await deleteAuctioneer(auctioneerId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/auctioneers');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <div className="space-y-6">
      <FormPageLayout
        formTitle={isViewMode ? "Visualizar Leiloeiro" : "Editar Leiloeiro"}
        formDescription={auctioneer?.name || 'Carregando...'}
        icon={Gavel}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        isValid={formRef.current?.formState.isValid}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
      >
          <AuctioneerForm
            ref={formRef}
            initialData={auctioneer}
            onSubmitAction={handleFormSubmit}
          />
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
              <AuctioneerDashboardSection auctioneerId={auctioneerId} />
          </CardContent>
      </Card>
    </div>
  );
}
