
'use client';

import { useState, useEffect, useCallback } from 'react';
import SellerForm from '../../seller-form';
import { getSeller, updateSeller, deleteSeller, type SellerFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2, BarChart3, TrendingUp, DollarSign, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSellerDashboardDataAction } from '../analysis/actions';
import type { SellerDashboardData } from '@/services/seller.service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

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
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                        <Legend />
                        <Line type="monotone" dataKey="Faturamento" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}

function DeleteSellerButton({ sellerId, sellerName, onAction }: { sellerId: string; sellerName: string; onAction: () => void; }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Basic check: in a real app, this would query for related auctions/lots
  const canDelete = true; 

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSeller(sellerId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/sellers');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
     <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting || !canDelete}>
          {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é permanente. Tem certeza que deseja excluir o comitente "{sellerName}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
            {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Confirmar Exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function EditSellerPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  
  const [seller, setSeller] = useState<SellerFormData | null>(null);
  const [judicialBranches, setJudicialBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(true);

  const fetchPageData = useCallback(async () => {
      if (!sellerId) return;
      setIsLoading(true);
      try {
        const [sellerData, branchesData] = await Promise.all([
            getSeller(sellerId),
            getJudicialBranches()
        ]);

        if (!sellerData) {
            notFound();
            return;
        }
        setSeller(sellerData);
        setJudicialBranches(branchesData);
      } catch (e) {
          console.error("Error fetching seller data", e);
          notFound();
      } finally {
        setIsLoading(false);
      }
  }, [sellerId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  

  if (isLoading || !seller) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }


  return (
     <div className="space-y-6">
        <div className="flex justify-end gap-2">
           {isViewMode ? (
            <Button onClick={() => setIsViewMode(false)}>
              <Edit className="mr-2 h-4 w-4" /> Entrar em Modo de Edição
            </Button>
           ) : null}
            <DeleteSellerButton sellerId={sellerId} sellerName={seller.name} onAction={fetchPageData} />
        </div>
        <SellerForm
          initialData={seller}
          judicialBranches={judicialBranches}
          onSubmitAction={(data) => updateSeller(sellerId, data)}
          formTitle={isViewMode ? "Visualizar Comitente" : "Editar Comitente"}
          formDescription={isViewMode ? "Consulte as informações abaixo." : "Modifique os detalhes do comitente existente."}
          submitButtonText="Salvar Alterações"
          isViewMode={isViewMode}
          onUpdateSuccess={() => {
              fetchPageData();
              setIsViewMode(true);
          }}
          onCancelEdit={() => setIsViewMode(true)}
        />
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
