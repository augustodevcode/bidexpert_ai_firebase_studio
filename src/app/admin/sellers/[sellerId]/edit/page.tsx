// src/app/admin/sellers/[sellerId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SellerForm from '../../seller-form';
import { getSeller, updateSeller, deleteSeller, type SellerFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { Button } from '@/components/ui/button';
import { BarChart3, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSellerDashboardDataAction } from '../../analysis/actions';
import type { SellerDashboardData } from '@/services/seller.service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LineChart, BarChart as RechartsBarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';
import FormPageLayout from '@/components/admin/form-page-layout'; // Importar o novo layout

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

    // ... (O conteúdo da dashboard section permanece o mesmo)
    return (
        <div className="space-y-4">
             {/* ... */}
        </div>
    )
}

export default function EditSellerPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [seller, setSeller] = useState<SellerFormData | null>(null);
  const [judicialBranches, setJudicialBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = React.useRef<any>(null); // Ref para o formulário

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
  
  const handleDelete = async () => {
    const result = await deleteSeller(sellerId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/sellers');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
      if (formRef.current) {
          await formRef.current.requestSubmit();
      }
  };

  // Esta função será passada para o SellerForm
  const handleFormSubmit = async (data: SellerFormData) => {
    setIsSubmitting(true);
    const result = await updateSeller(sellerId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Comitente atualizado.' });
        fetchPageData(); // Re-fetch data
        setIsViewMode(true); // Return to view mode on success
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  return (
     <div className="space-y-6" data-ai-id="admin-seller-form-card">
        <FormPageLayout
            formTitle={isViewMode ? `Visualizar Comitente` : `Editar Comitente`}
            formDescription={seller?.name || 'Carregando...'}
            icon={Users}
            isViewMode={isViewMode}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            onEnterEditMode={() => setIsViewMode(false)}
            onCancel={() => setIsViewMode(true)}
            onSave={handleSave}
            onDelete={handleDelete}
        >
            <SellerForm
                ref={formRef} // Passando a ref para o formulário
                initialData={seller}
                judicialBranches={judicialBranches}
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
