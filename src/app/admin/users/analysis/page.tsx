// src/app/admin/users/analysis/page.tsx
'use client';

import { PieChart, Pie, Bar, BarChart as ReBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getUsersPerformanceAction, getAccountTypeDistributionAction, getHabilitationStatusDistributionAction, type UserPerformanceData } from './actions';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DollarSign, Gavel, Loader2, ShoppingBag, Users, BarChart3, TrendingUp, Handshake, UserCheck } from 'lucide-react';
import { createUserAnalysisColumns } from './columns';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';

const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export default function UserAnalysisPage() {
  const [performanceData, setPerformanceData] = useState<UserPerformanceData[]>([]);
  const [accountTypeData, setAccountTypeData] = useState<{name: string, value: number}[]>([]);
  const [habilitationStatusData, setHabilitationStatusData] = useState<{name: string, value: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [perfData, accTypeData, habStatusData] = await Promise.all([
          getUsersPerformanceAction(),
          getAccountTypeDistributionAction(),
          getHabilitationStatusDistributionAction()
      ]);
      setPerformanceData(perfData);
      setAccountTypeData(accTypeData);
      setHabilitationStatusData(habStatusData.map(d => ({ ...d, name: getUserHabilitationStatusInfo(d.name as any).text })));
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const columns = useMemo(() => createUserAnalysisColumns(), []);
  
  const topUsersBySpending = useMemo(() => {
    return [...performanceData]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map(item => ({ name: item.fullName, Gasto: item.totalSpent }));
  }, [performanceData]);
  
  const { totalUsers, totalSpent, totalBids, totalWins } = useMemo(() => {
    return performanceData.reduce((acc, item) => {
        acc.totalSpent += item.totalSpent;
        acc.totalBids += item.totalBids;
        acc.totalWins += item.lotsWon;
        return acc;
    }, { totalUsers: performanceData.length, totalSpent: 0, totalBids: 0, totalWins: 0 });
  }, [performanceData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Carregando análise de usuários...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Users className="h-6 w-6 mr-2 text-primary" />
            Análise de Performance de Usuários
          </CardTitle>
          <CardDescription>
            Visão geral do comportamento e atividade dos usuários na plataforma.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Usuários Totais" value={totalUsers} icon={Users} description="Total de contas cadastradas" isLoading={isLoading} />
        <StatCard title="Valor Total Gasto" value={totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} description="Soma de todos os lotes arrematados" isLoading={isLoading} />
        <StatCard title="Lotes Arrematados" value={totalWins} icon={ShoppingBag} description="Total de lotes vencidos por usuários" isLoading={isLoading} />
        <StatCard title="Total de Lances" value={totalBids} icon={Gavel} description="Total de lances feitos na plataforma" isLoading={isLoading} />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                <CardTitle>Top 10 Usuários por Valor Gasto</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={topUsersBySpending} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Legend />
                    <Bar dataKey="Gasto" fill="hsl(var(--primary))" />
                </ReBarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Distribuição de Status de Habilitação</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={habilitationStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {habilitationStatusData.map((entry, index) => (
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

       <Card>
         <CardHeader>
            <CardTitle>Dados Detalhados por Usuário</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
                columns={columns}
                data={performanceData}
                searchColumnId="fullName"
                searchPlaceholder="Buscar por nome ou email..."
                facetedFilterColumns={[{ id: 'habilitationStatus', title: 'Status', options: habilitationStatusData.map(d => ({label: d.name, value: d.name})) }]}
            />
         </CardContent>
       </Card>
    </div>
  );
}
