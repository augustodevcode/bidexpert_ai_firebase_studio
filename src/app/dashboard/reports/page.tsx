// src/app/dashboard/reports/page.tsx
/**
 * @fileoverview Página "Meus Relatórios" do Painel do Usuário.
 * Este componente de cliente busca e exibe um resumo do desempenho de
 * lances e arremates do usuário logado. Ele apresenta métricas chave como
 * total gasto, número de lotes arrematados e um gráfico de pizza mostrando
 * a distribuição dos gastos por categoria.
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
    Package,
    AlertCircle,
    Tag
} from 'lucide-react';
import { 
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getUserReportDataAction, type UserReportData } from './actions';
import { Skeleton } from '@/components/ui/skeleton';


const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6666'];

const initialReportData: UserReportData = {
    totalLotsWon: 0,
    totalAmountSpent: 0,
    totalBidsPlaced: 0,
    spendingByCategory: [],
};

export default function ReportsPage() {
    const { userProfileWithPermissions, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [reportData, setReportData] = useState<UserReportData>(initialReportData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReportData = useCallback(async (userId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserReportDataAction(userId);
            setReportData(data);
        } catch (err: any) {
            setError(err.message || 'Falha ao carregar relatórios.');
            toast({ title: 'Erro', description: err.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!authLoading && userProfileWithPermissions?.uid) {
            fetchReportData(userProfileWithPermissions.uid);
        } else if (!authLoading) {
            setIsLoading(false);
            setError("Você precisa estar logado para ver seus relatórios.");
        }
    }, [userProfileWithPermissions, authLoading, fetchReportData]);

    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]" data-ai-id="my-reports-loading-spinner">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Gerando seus relatórios...</p>
            </div>
        );
    }
    
    if (error) {
         return (
             <div className="text-center py-12" data-ai-id="my-reports-error-state">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="text-xl font-semibold text-destructive">{error}</h3>
             </div>
         );
    }

  return (
    <div className="space-y-8" data-ai-id="my-reports-page-container">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-primary" />
            Meus Relatórios
          </CardTitle>
          <CardDescription>
            Acompanhe seu histórico de arremates, gastos e lances na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-ai-id="my-reports-stats-grid">
        <StatCard 
            title="Total Gasto"
            value={reportData.totalAmountSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon={DollarSign}
            description="Soma de todos os seus arremates."
            isLoading={isLoading}
        />
        <StatCard 
            title="Lotes Arrematados"
            value={reportData.totalLotsWon}
            icon={ShoppingBag}
            description="Total de lotes que você venceu."
            isLoading={isLoading}
        />
         <StatCard 
            title="Total de Lances"
            value={reportData.totalBidsPlaced}
            icon={Gavel}
            description="Número de lances feitos por você."
            isLoading={isLoading}
        />
      </div>

       <Card className="shadow-md" data-ai-id="my-reports-category-spending-chart">
          <CardHeader>
            <CardTitle className="flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/> Gastos por Categoria</CardTitle>
            <CardDescription>Distribuição dos seus gastos totais por categoria de lote.</CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {reportData.spendingByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={reportData.spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            if (!percent) return null;
                            return (
                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                                {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}>
                            {reportData.spendingByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Nenhum dado de gastos para exibir.</p>
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
