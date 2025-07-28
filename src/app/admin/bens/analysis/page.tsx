// src/app/admin/bens/analysis/page.tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getBensAnalysisAction, type BemAnalysisData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, Loader2, Package, TrendingUp, BarChart3, Boxes, CheckSquare, BrainCircuit } from 'lucide-react';
import { createBemAnalysisColumns } from './columns';
import { analyzeAuctionDataAction } from '@/app/admin/auctions/analysis/actions'; // Reusing generic analysis action

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6666'];

function AIAnalysisSection({ performanceData, isLoading }: { performanceData: BemAnalysisData | null, isLoading: boolean }) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (!isLoading && performanceData && performanceData.bens.length > 0) {
            setIsLoadingAI(true);
            const dataForAI = performanceData.bens.slice(0, 50).map(bem => ({
                title: bem.title,
                status: bem.status,
                totalRevenue: bem.evaluationValue, // Using evaluation value as a proxy for revenue potential
                categoryName: bem.categoryName,
            }));
            
            analyzeAuctionDataAction({ performanceData: dataForAI })
                .then(result => setAnalysis(result))
                .catch(err => {
                    console.error("AI Analysis for Bens failed:", err);
                    setAnalysis("Não foi possível gerar a análise de IA para os bens no momento.");
                })
                .finally(() => setIsLoadingAI(false));
        }
    }, [performanceData, isLoading]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-primary"/> Análise do Inventário (IA)
                </CardTitle>
                <CardDescription>
                    Insights gerados por IA com base na composição e valor do seu inventário de bens.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analisando inventário...</span>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground whitespace-pre-line bg-secondary/40 p-4 rounded-md">
                        {analysis || "Nenhuma análise disponível."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function BemAnalysisPage() {
  const [analysisData, setAnalysisData] = useState<BemAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getBensAnalysisAction();
      setAnalysisData(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createBemAnalysisColumns(), []);

  if (isLoading || !analysisData) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando análise de bens...</div>
  }
  
  const statusOptions = [...new Set(analysisData.bens.map(b => b.status))].map(s => ({value: s, label: s}));
  const categoryOptions = analysisData.distributionByCategory.map(c => ({value: c.name, label: c.name}));
  
  const facetedFilterColumns = [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'categoryName', title: 'Categoria', options: categoryOptions },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance de Bens
          </CardTitle>
          <CardDescription>
            Visão geral do inventário de bens da plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de Bens Cadastrados" value={analysisData.totalBens} icon={Package} description="Total de itens no inventário" />
        <StatCard title="Bens Disponíveis" value={analysisData.availableBensCount} icon={CheckSquare} description="Itens prontos para serem loteados" />
        <StatCard title="Valor em Estoque" value={analysisData.totalEvaluationValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma das avaliações dos bens disponíveis" />
        <StatCard title="Bens em Lotes" value={analysisData.lottedBensCount} icon={Boxes} description="Itens que já estão em algum lote" />
      </div>

       <AIAnalysisSection performanceData={analysisData} isLoading={isLoading} />

       <Card>
        <CardHeader>
            <CardTitle>Distribuição de Bens por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={analysisData.distributionByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label>
                     {analysisData.distributionByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} itens`, name]} />
                <Legend />
            </PieChart>
            </ResponsiveContainer>
        </CardContent>
       </Card>

       <Card>
         <CardHeader>
            <CardTitle>Inventário Completo de Bens</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={analysisData.bens}
                searchColumnId="title"
                searchPlaceholder="Buscar bem..."
                facetedFilterColumns={facetedFilterColumns}
            />
         </CardContent>
       </Card>
    </div>
  );
}
