/**
 * @fileoverview Página do dashboard administrativo principal com métricas reais da plataforma.
 */
// src/app/admin/dashboard/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, DollarSign, Gavel, Package, Users, BarChart3, TrendingUp, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { AdminReportData } from '@/types';
import { getAdminReportDataAction } from '@/app/admin/reports/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetPreferences } from '@/contexts/widget-preferences-context';
import { LineChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Cell } from 'recharts';


function StatCard({ title, value, icon: Icon, description, isLoading, colorClass = 'bg-primary text-primary-foreground', link }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean, colorClass?: string, link?: string }) {
    const cardContent = (
      <Card className={`${colorClass} shadow-lg transition-transform hover:scale-105`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">{title}</span>
               {isLoading ? (
                <Skeleton className="h-9 w-24 bg-white/20" />
            ) : (
                <span className="text-4xl font-bold">{value}</span>
            )}
            </div>
            <Icon className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
    );

     return link ? <Link href={link} className="block hover:no-underline">{cardContent}</Link> : cardContent;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWidgetVisible } = useWidgetPreferences();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const fetchedStats = await getAdminReportDataAction();
        setStats(fetchedStats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6" data-ai-id="admin-dashboard-page-container">
      {/* O cabeçalho com título foi movido para o AdminHeader e AdminLayout */}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-ai-id="admin-dashboard-stats-grid">
            {isWidgetVisible('totalRevenue') && (
              <StatCard 
                  title="Faturamento Total" 
                  value={(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})} 
                  icon={DollarSign} 
                  description="Soma de todos os lotes vendidos"
                  colorClass="bg-sky-500 text-white"
                  link="/admin/reports"
                  isLoading={isLoading} 
              />
            )}
            {isWidgetVisible('activeAuctions') && (
              <StatCard 
                  title="Leilões Ativos" 
                  value={stats?.activeAuctions ?? '...'} 
                  icon={Gavel} 
                  description="Leilões abertos para lances" 
                  colorClass="bg-teal-500 text-white"
                  link="/admin/auctions"
                  isLoading={isLoading} 
              />
            )}
            {isWidgetVisible('lotsSoldCount') && (
              <StatCard 
                  title="Lotes Vendidos" 
                  value={stats?.lotsSoldCount ?? '...'} 
                  icon={Package} 
                  description="Total de lotes arrematados"
                  colorClass="bg-blue-800 text-white"
                  link="/admin/lots/analysis"
                  isLoading={isLoading} 
              />
            )}
            {isWidgetVisible('newUsers') && (
              <StatCard 
                  title="Novos Usuários (30d)" 
                  value={`+${stats?.newUsersLast30Days ?? '...'}`} 
                  icon={Users} 
                  description="Novos registros no último mês"
                  colorClass="bg-indigo-500 text-white"
                  link="/admin/users/analysis" 
                  isLoading={isLoading} 
              />
            )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center"><LineChartIcon className="mr-2 h-5 w-5"/> Vendas Mensais (Últimos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                    <Legend />
                    <Line type="monotone" dataKey="Sales" name="Vendas" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                </LineChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
         <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5"/> Lotes Vendidos por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={stats?.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {stats?.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
